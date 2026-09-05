'use strict';

// The single place a rights rule is evaluated. If a license check ever appears
// in a controller or a template, this file has failed at its job.
//
// display_scope answers "may this be rendered to a stranger", and is derived,
// never assigned. It is NOT the same question as board_images.is_public, which
// is the contributor's own choice; a public image satisfies both.

const SCOPE = {
  PUBLIC: 'public',
  ATTRIBUTED: 'attributed',
  INTERNAL: 'internal',
  BLOCKED: 'blocked',
};

// A grant nobody has re-checked in a year is not a grant worth relying on.
const GRANT_MAX_AGE_DAYS = 365;

function isStale(verifiedAt, now = new Date()) {
  if (!verifiedAt) return true;
  const ageDays = (now - new Date(verifiedAt)) / 86400000;
  return ageDays > GRANT_MAX_AGE_DAYS;
}

function isExpired(permission, now = new Date()) {
  if (!permission || !permission.expires_at) return false;
  return new Date(permission.expires_at) < now;
}

/**
 * @param {object|null} license    an image_licenses row
 * @param {object} image           the board_images row being saved
 * @param {object|null} permission an image_permissions row, when license.needs_grant
 */
function deriveDisplayScope(license, image, permission = null, now = new Date()) {
  // No license means unclassified, and unclassified fails closed.
  if (!license || !license.allows_public_display) return SCOPE.BLOCKED;

  if (license.needs_grant) {
    if (!permission || isExpired(permission, now)) return SCOPE.INTERNAL;
    if (isStale(image.rights_verified_at, now)) return SCOPE.INTERNAL;
  }

  return license.requires_attribution ? SCOPE.ATTRIBUTED : SCOPE.PUBLIC;
}

// Storage is a separate axis from display: a brand may be happy to be shown and
// unhappy to be rehosted. board_images.name carries the S3 key when mirrored.
function deriveStorage(license) {
  if (!license) return 'none';
  if (license.allows_redistribution) return 'mirrored';
  if (license.allows_public_display) return 'hotlink';
  return 'none';
}

/**
 * Loads the related rows and writes both derived columns onto the instance.
 * Called from the BoardImage beforeSave hook.
 */
async function applyTo(image, models) {
  const license = image.license_id
    ? await models.ImageLicense.findByPk(image.license_id, { raw: true })
    : null;
  const permission = image.permission_id
    ? await models.ImagePermission.findByPk(image.permission_id, { raw: true })
    : null;

  image.display_scope = deriveDisplayScope(license, image, permission);
  if (!image.changed('storage')) image.storage = deriveStorage(license);
  return image;
}

// A bulk insert bypasses instance hooks entirely, which is exactly how a
// harvest writes. Run this on a schedule and treat any row it returns as a bug
// in whatever wrote it, not as something to quietly repair.
const RECONCILE_SQL = `
  SELECT bi.id,
         bi.display_scope AS stored,
         CASE
           WHEN l.id IS NULL OR l.allows_public_display = 0 THEN 'blocked'
           WHEN l.needs_grant = 1
                AND (p.id IS NULL
                     OR (p.expires_at IS NOT NULL AND p.expires_at < CURDATE())
                     OR bi.rights_verified_at IS NULL
                     OR bi.rights_verified_at < DATE_SUB(NOW(), INTERVAL ${GRANT_MAX_AGE_DAYS} DAY))
                THEN 'internal'
           WHEN l.requires_attribution = 1 THEN 'attributed'
           ELSE 'public'
         END AS expected
    FROM board_images bi
    LEFT JOIN image_licenses l ON l.id = bi.license_id
    LEFT JOIN image_permissions p ON p.id = bi.permission_id
   HAVING stored <> expected
`;

async function reconcile(sequelize) {
  const [rows] = await sequelize.query(RECONCILE_SQL);
  return rows;
}

const RENDERABLE = [SCOPE.PUBLIC, SCOPE.ATTRIBUTED];

/**
 * Turns a board_images row into the only shape a client is ever given:
 * a URL and an optional credit line. Returns null when the image may not be
 * rendered, so a caller cannot accidentally emit one.
 *
 * The license has to be loaded. Without it there is no way to know whether a
 * credit is required, and an uncredited CC-BY image is a licence breach - so
 * a missing license fails closed rather than rendering bare.
 */
function publicImage(image, s3PublicRoot) {
  if (!image) return null;
  if (!image.is_public || !RENDERABLE.includes(image.display_scope)) return null;

  const license = image.ImageLicense || null;
  if (!license) return null;

  // A mirrored image lives in the uploads bucket under `name`, the same column
  // user uploads use. A hotlinked one was never copied and is served from the
  // source, which is why storage and display are separate columns.
  const url = image.storage === 'mirrored' && image.name
    ? s3PublicRoot + image.name
    : image.source_url;
  if (!url) return null;

  return {
    id: image.id,
    url,
    credit: license.requires_attribution ? renderCredit(license, image) : null,
    credit_url: license.requires_attribution ? (image.attribution_url || null) : null,
    is_default: !!image.is_default,
    position: image.position || 0,
  };
}

function renderCredit(license, image) {
  if (image.attribution_text) return image.attribution_text;
  const source = image.BoardSource || null;
  const template = license.attribution_template || '{author}, {license}';
  return template
    .replace('{author}', image.author || (source && source.name) || 'Unknown')
    .replace('{license}', license.name || license.code)
    .replace('{source}', (source && source.name) || '')
    .replace(/,\s*$/, '')
    .trim();
}

module.exports = {
  SCOPE,
  RENDERABLE,
  publicImage,
  GRANT_MAX_AGE_DAYS,
  deriveDisplayScope,
  deriveStorage,
  applyTo,
  reconcile,
  RECONCILE_SQL,
};
