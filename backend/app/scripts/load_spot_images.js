'use strict';

// Loads the reviewed spot photos into spot_images: one row per spot, the
// manifest's rank-1 image.
//
// An import, not a seeder. db:seed is tracked in SequelizeData and runs once;
// this file gets re-run whenever the harvest is redone or ranks 2 and 3 are
// added, so it upserts on (spot_id, content_hash) and a second run over the
// same manifest changes nothing.
//
// Runs on the box, not the Mac: it needs sequelize, and `npm ci` in backend/
// still fails on darwin-arm64 because sharp 0.30.7 ships no prebuild for it.
// data/spot_images.json is committed precisely so `git pull` puts it there.
//
// Usage:
//   node app/scripts/load_spot_images.js --dry-run
//   node app/scripts/load_spot_images.js
//   node app/scripts/load_spot_images.js --rank=all
//   node app/scripts/load_spot_images.js --file=/path/to/spot_images.json

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./../models');
const DisplayScope = require('./../services/rights/DisplayScope');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};

const DRY_RUN = args.includes('--dry-run');
const ALL_RANKS = flag('rank', '1') === 'all';
// Resolved from __file__, not cwd: this gets pasted into an SSM session where
// the working directory is whatever the last command left behind.
const DEFAULT_FILE = path.join(__dirname, '..', '..', 'data', 'spot_images.json');
const FILE = flag('file', DEFAULT_FILE);
const VERIFIED_BY = flag('verified-by', 'visual review 2026-09');
const SOURCE_KEY = 'wikimedia';
const CHUNK = 200;

// distance_m is MEDIUMINT UNSIGNED. The commons-text tier does not filter on
// distance, so the current set already reaches 16,708,549 m - an image of an
// Asturian beach standing in for a Baja one - against a ceiling of 16,777,215.
// A wider-radius re-harvest will cross it, and MySQL out of strict mode clamps
// silently rather than erroring.
const DISTANCE_MAX = 16777215;

// The manifest carries the licence as Commons prints it. Normalizing to the
// image_licenses.code shape covers every string in the set today, including
// the ports: "CC BY 3.0 us" -> CC-BY-3.0-US, "Public domain" -> public-domain.
// A port the seeders have not got is meant to stop the load, not skip a row -
// a silently dropped image is a beach with no photo for a reason nobody can
// find six months later.
function licenseKey(label) {
  return String(label || '').trim().replace(/\s+/g, '-').toUpperCase();
}

async function lookups() {
  const licenses = await db.ImageLicense.findAll({ raw: true });
  const byCode = new Map(licenses.map((l) => [licenseKey(l.code), l]));

  const source = await db.ContentSource.findOne({
    where: { source_key: SOURCE_KEY },
    raw: true,
  });
  if (!source) {
    throw new Error(`content_sources has no ${SOURCE_KEY} row - run the seeders first`);
  }
  return { byCode, source };
}

function selectImages(spot) {
  if (!spot.images || !spot.images.length) return [];
  return ALL_RANKS ? spot.images : [spot.images[0]];
}

function buildRow(spot, image, position, refs, now, stats) {
  const license = refs.byCode.get(licenseKey(image.license));
  if (!license) {
    stats.unmapped.add(image.license);
    return null;
  }

  let distance = image.distance_m == null || image.distance_m === ''
    ? null
    : Math.round(Number(image.distance_m));
  if (distance !== null && distance > DISTANCE_MAX) {
    distance = DISTANCE_MAX;
    stats.distance_clamped += 1;
  }

  const row = {
    spot_id: spot.spot_id,
    source_id: refs.source.id,
    license_id: license.id,
    permission_id: null,
    name: `spot-images/${image.sha256}/`,
    source_url: image.source_page_url || null,
    content_hash: image.sha256,
    // width is what tells SpotImageService which derivative keys were built.
    // These are the header-read values, not what the Commons API reported -
    // the API was wrong on 2,311 of 2,341 files, and a wrong width here emits
    // a srcset entry for an object that does not exist.
    width: image.width || null,
    height: image.height || null,
    author: image.author || null,
    attribution_text: image.attribution_line || null,
    attribution_url: image.source_page_url || null,
    subject: image.subject,
    is_public: true,
    is_default: position === 0,
    position,
    distance_m: distance,
    relevance_score: image.relevance_score == null ? null : Number(image.relevance_score),
    rights_verified_at: now,
    rights_verified_by: VERIFIED_BY,
    last_checked_at: now,
  };

  // bulkCreate skips the beforeSave hook that would derive these, so they are
  // written here and checked by reconcile at the end rather than trusted.
  row.display_scope = DisplayScope.deriveDisplayScope(license, row, null, now);
  row.storage = DisplayScope.deriveStorage(license);
  return row;
}

async function assertSpotsExist(rows) {
  const ids = [...new Set(rows.map((r) => r.spot_id))];
  const found = new Set();
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    const [got] = await db.sequelize.query(
      'SELECT id FROM surfline_spots WHERE id IN (:ids)',
      { replacements: { ids: slice } }
    );
    got.forEach((r) => found.add(r.id));
  }
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length) {
    throw new Error(
      `${missing.length} spot ids in the manifest are not in surfline_spots, `
      + `starting ${missing.slice(0, 5).join(', ')} - seed the spots first`
    );
  }
}

const UPDATABLE = [
  'source_id', 'license_id', 'permission_id', 'name', 'source_url', 'storage',
  'width', 'height', 'author', 'attribution_text', 'attribution_url', 'subject',
  'display_scope', 'is_public', 'is_default', 'position', 'distance_m',
  'relevance_score', 'rights_verified_at', 'rights_verified_by',
  'last_checked_at', 'updated_at',
];

async function writeRows(rows) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.SpotImage.bulkCreate(rows.slice(i, i + CHUNK), {
      updateOnDuplicate: UPDATABLE,
    });
  }
}

// A re-harvest can promote a different photograph to rank 1. The new row
// upserts fine, but the old one keeps is_default = 1 and /nearest starts
// returning two defaults for that spot, picking whichever the index yields.
async function demoteStaleDefaults(rows) {
  const want = new Map(rows.filter((r) => r.is_default).map((r) => [r.spot_id, r.content_hash]));
  const [current] = await db.sequelize.query(
    'SELECT id, spot_id, content_hash FROM spot_images WHERE is_default = 1'
  );
  const stale = current
    .filter((r) => want.get(r.spot_id) !== r.content_hash)
    .map((r) => r.id);

  for (let i = 0; i < stale.length; i += CHUNK) {
    await db.sequelize.query(
      'UPDATE spot_images SET is_default = 0, updated_at = NOW() WHERE id IN (:ids)',
      { replacements: { ids: stale.slice(i, i + CHUNK) } }
    );
  }
  return stale.length;
}

// OSM surface is the only free source of sandy/rocky/reef there is, but it is
// not the only writer here - the contribution flow lets a rider set bottom by
// hand. Filling nulls only means a re-run never overwrites one of those; a
// spot where the two disagree is reported and left alone.
async function backfillBottom(spots) {
  const byType = new Map();
  for (const spot of spots) {
    const type = spot.osm && spot.osm.beach_type;
    if (!type) continue;
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type).push(spot.spot_id);
  }

  let filled = 0;
  const disagree = [];
  for (const [type, ids] of byType) {
    for (let i = 0; i < ids.length; i += CHUNK) {
      const slice = ids.slice(i, i + CHUNK);
      const [rows] = await db.sequelize.query(
        'SELECT id, bottom FROM surfline_spots WHERE id IN (:ids)',
        { replacements: { ids: slice } }
      );
      rows.filter((r) => r.bottom && r.bottom !== type)
        .forEach((r) => disagree.push(`${r.id}: ${r.bottom} vs osm ${type}`));

      const [, meta] = await db.sequelize.query(
        'UPDATE surfline_spots SET bottom = :type WHERE bottom IS NULL AND id IN (:ids)',
        { replacements: { type, ids: slice } }
      );
      filled += (meta && meta.affectedRows) || 0;
    }
  }
  return { filled, disagree };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const spots = manifest.spots || [];
  console.log(`${FILE}\n  generated ${manifest.generated_at}, ${spots.length} spots`);

  const refs = await lookups();
  const now = new Date();
  const stats = { unmapped: new Set(), distance_clamped: 0 };

  const rows = [];
  for (const spot of spots) {
    selectImages(spot).forEach((image, position) => {
      const row = buildRow(spot, image, position, refs, now, stats);
      if (row) rows.push(row);
    });
  }

  if (stats.unmapped.size) {
    throw new Error(
      `no image_licenses row for: ${[...stats.unmapped].join(', ')} `
      + '- seed the licence before loading, do not skip the images'
    );
  }

  const scopes = rows.reduce((acc, r) => {
    acc[r.display_scope] = (acc[r.display_scope] || 0) + 1;
    return acc;
  }, {});
  console.log(`  ${rows.length} rows: ${JSON.stringify(scopes)}`);
  if (scopes.blocked) {
    throw new Error(`${scopes.blocked} rows derive display_scope = blocked - every image in this set is free-licensed, so a blocked row means a bad licence mapping`);
  }
  if (stats.distance_clamped) {
    console.log(`  ${stats.distance_clamped} distance_m values clamped to ${DISTANCE_MAX}`);
  }

  if (DRY_RUN) {
    console.log('dry run, nothing written');
    return 0;
  }

  await assertSpotsExist(rows);
  await writeRows(rows);
  const demoted = await demoteStaleDefaults(rows);
  const bottom = await backfillBottom(spots);

  const [stored] = await db.sequelize.query(
    'SELECT COUNT(*) AS n, SUM(is_default = 1) AS defaults FROM spot_images'
  );
  console.log(`  stored ${stored[0].n} rows, ${stored[0].defaults} defaults, ${demoted} demoted`);
  console.log(`  surfline_spots.bottom filled ${bottom.filled}, ${bottom.disagree.length} disagree with OSM`);
  bottom.disagree.slice(0, 10).forEach((line) => console.log(`    ${line}`));

  const bad = await DisplayScope.reconcile(db.sequelize, 'spot_images');
  if (bad.length) {
    console.error(`${bad.length} rows have a display_scope the licence does not support:`);
    bad.slice(0, 10).forEach((r) => console.error(`  id ${r.id}: stored ${r.stored}, expected ${r.expected}`));
    return 1;
  }
  console.log('  reconcile clean');
  return 0;
}

main()
  .then(async (code) => {
    await db.sequelize.close();
    process.exit(code);
  })
  .catch(async (err) => {
    console.error(err.message || err);
    await db.sequelize.close();
    process.exit(1);
  });
