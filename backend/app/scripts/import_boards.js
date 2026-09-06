'use strict';

// Imports the harvested surfboard catalog into manufacturers / boards /
// board_model_sources / board_images.
//
// This is an import, not a seeder. db:seed is tracked in SequelizeData and runs
// once; the catalog gets re-harvested for new season models, corrected years and
// added images, so it has to be re-runnable. Everything upserts on a natural
// key and a second run over the same file changes nothing.
//
// Usage:
//   node app/scripts/import_boards.js --report-makers
//   node app/scripts/import_boards.js --dry-run
//   node app/scripts/import_boards.js --file=data/board_catalog.json
//
// Input is the harvester's own JSON: an array of records with at least
// record_type, maker and model. Records whose record_type is not 'model' are
// stock listings from retailer feeds, not catalog entries, and are skipped.
//
// --file takes a comma-separated list because the harvest output is a
// generated file that gets overwritten by the next run, and the hand-compiled
// historical rows have to survive that.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./../models');
const DisplayScope = require('./../services/rights/DisplayScope');
const { getUserBoardQueue } = require('./../services/queue/BetterQueue');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};
const DRY_RUN = args.includes('--dry-run');
// NOT data/boards.json - that name is taken by the 200-row fixture the boards
// seeder loads, and pointing this at it silently imports nothing, because
// fixture rows carry manufacturer_id rather than a maker name.
const FILES = flag('file', 'data/board_catalog.json,data/board_registry.json')
  .split(',')
  .map((f) => f.trim())
  .filter(Boolean);

const {
  slugify,
  makerSlugOf,
  nearDuplicateMakers,
  merge,
} = require('./../lib/board_catalog');

async function lookups() {
  const [licenses, sources] = await Promise.all([
    db.ImageLicense.findAll({ raw: true }),
    db.BoardSource.findAll({ raw: true }),
  ]);
  return {
    licenseByCode: new Map(licenses.map((l) => [l.code, l])),
    sourceByKey: new Map(sources.map((s) => [s.source_key, s])),
  };
}

async function resolveManufacturer(board, cache) {
  if (cache.has(board.maker_slug)) return cache.get(board.maker_slug);

  let row = await db.Manufacturer.findOne({ where: { slug: board.maker_slug } });
  if (!row) {
    // A maker already typed in by a person will not have a slug yet, so match
    // the name before creating a duplicate alongside it.
    row = await db.Manufacturer.findOne({ where: { name: board.maker } });
  }
  if (!row) {
    row = await db.Manufacturer.create({
      name: board.maker,
      slug: board.maker_slug,
      aliases: [...board.maker_aliases],
    });
  } else {
    const aliases = new Set([...(row.aliases || []), ...board.maker_aliases]);
    row.slug = row.slug || board.maker_slug;
    row.aliases = [...aliases];
    await row.save();
  }
  cache.set(board.maker_slug, row);
  return row;
}

/*
 * The designer as an entity, resolved the same way a maker is. Returns null
 * rather than creating a row when the record carries no designer, which is
 * every record in the current harvest - Shopify products.json has no such
 * field. Guarding here is what stops a future source with an empty string in
 * that column filling the table with one blank shaper.
 *
 * slugify, not makerSlugOf: the maker version strips a trailing "Surfboards"
 * or "Designs", which is right for a label and wrong for a person - it would
 * turn Slater Designs into "slater".
 */
async function resolveShaper(board, cache) {
  const name = String(board.designer || '').trim();
  if (!name) return null;

  const slug = slugify(name);
  if (!slug) return null;
  if (cache.has(slug)) return cache.get(slug);

  let row = await db.Shaper.findOne({ where: { slug: slug } });
  if (!row) {
    // A shaper typed in by a person will not have a slug yet, so match the
    // name before creating a duplicate alongside them.
    row = await db.Shaper.findOne({ where: { name: name } });
  }
  if (!row) {
    row = await db.Shaper.create({ name: name, slug: slug, aliases: [name] });
  } else {
    const aliases = new Set([...(row.aliases || []), name]);
    row.slug = row.slug || slug;
    row.aliases = [...aliases];
    await row.save();
  }
  cache.set(slug, row);
  return row;
}

async function importBoard(board, refs, stats) {
  const maker = await resolveManufacturer(board, refs.makerCache);
  const shaper = await resolveShaper(board, refs.shaperCache);

  let row = await db.Board.findOne({ where: { canonical_key: board.canonical_key } });

  if (row && row.createdBy) {
    // Somebody added this board by hand. The harvest may attach provenance to
    // it but must not rewrite what they typed.
    stats.skipped_user_owned += 1;
  } else if (row) {
    row.set({
      manufacturer_id: maker.id,
      slug: row.slug || board.slug,
      // A harvest with no designer must not unassign one that is already set.
      shaper_id: shaper ? shaper.id : row.shaper_id,
      designer: board.designer ?? row.designer,
      category: board.category ?? row.category,
      discontinued: board.discontinued,
      year_introduced: board.year_introduced ?? row.year_introduced,
      year_confidence: board.year_confidence ?? row.year_confidence,
      year_evidence: board.year_evidence ?? row.year_evidence,
      length_in: board.length_in ?? row.length_in,
      width_in: board.width_in ?? row.width_in,
      thickness_in: board.thickness_in ?? row.thickness_in,
      volume_l: board.volume_l ?? row.volume_l,
    });
    if (row.changed()) stats.updated += 1;
    await row.save();
  } else {
    row = await db.Board.create({
      manufacturer_id: maker.id,
      shaper_id: shaper ? shaper.id : null,
      model: board.model,
      slug: board.slug,
      canonical_key: board.canonical_key,
      isPublic: true,
      createdBy: null,
      designer: board.designer,
      category: board.category,
      discontinued: board.discontinued,
      year_introduced: board.year_introduced,
      year_confidence: board.year_confidence,
      year_evidence: board.year_evidence,
      length_in: board.length_in,
      width_in: board.width_in,
      thickness_in: board.thickness_in,
      volume_l: board.volume_l,
    });
    stats.created += 1;
  }

  for (const src of board.sources) {
    const source = refs.sourceByKey.get(src.source_key);
    if (!source) { stats.unknown_source.add(src.source_key); continue; }
    const [, made] = await db.BoardModelSource.findOrCreate({
      where: { board_id: row.id, source_id: source.id, source_ref: src.source_ref },
      defaults: { source_url: src.source_url || '', payload: src.payload, fetched_at: new Date() },
    });
    if (made) stats.sources += 1;
  }

  for (const img of board.images) {
    const source = refs.sourceByKey.get(img.source_key);
    if (!source) continue;
    const license = refs.licenseByCode.get(source.default_license_id
      ? [...refs.licenseByCode.values()].find((l) => l.id === source.default_license_id).code
      : 'unknown');

    // No bytes are downloaded here, so there is nothing to hash. The URL stands
    // in as the dedupe key, which is what a re-run can actually compare.
    const hash = crypto.createHash('sha256').update(img.source_url).digest('hex');
    // scope('rights') on purpose: the default scope hides non-renderable rows
    // and the content_hash column, and every harvested image is both. Without
    // it this dedupe check finds nothing and a second run recreates them all.
    const existing = await db.BoardImage.scope('rights')
      .findOne({ where: { board_id: row.id, content_hash: hash } });
    if (existing) continue;

    const draft = { license_id: license.id, rights_verified_at: null };
    await db.BoardImage.create({
      board_id: row.id,
      source_id: source.id,
      license_id: license.id,
      source_url: img.source_url,
      content_hash: hash,
      // Harvested images are not the contributor's to publish, so is_public
      // stays off until somebody decides; display_scope is the rights half.
      is_public: false,
      is_default: false,
      storage: DisplayScope.deriveStorage(license),
      display_scope: DisplayScope.deriveDisplayScope(license, draft, null),
    });
    stats.images += 1;
  }

  return row.id;
}

async function main() {
  const files = FILES.map((f) => (path.isAbsolute(f) ? f : path.join(process.cwd(), f)));
  const records = [];
  for (const file of files) {
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`${path.basename(file)}: ${rows.length} records`);
    records.push(...rows);
  }

  // Optional curated map of maker-slug variants, e.g. { "sharpeye": "sharp-eye" }.
  const aliasFile = path.join(path.dirname(files[0]), 'maker_aliases.json');
  const makerAliases = fs.existsSync(aliasFile)
    ? JSON.parse(fs.readFileSync(aliasFile, 'utf8'))
    : {};

  const boards = merge(records, makerAliases);
  console.log(`${records.length} records -> ${boards.length} distinct models`);

  const suspect = nearDuplicateMakers(boards.map((b) => b.maker_slug));
  if (suspect.length) {
    console.log(`\n${suspect.length} maker slugs look like duplicates. Left alone they`);
    console.log(`import one board twice. Add the losing side to ${aliasFile}:`);
    for (const [a, b] of suspect) console.log(`  ${a}  <->  ${b}`);
  }
  if (args.includes('--report-makers')) return;

  const collisions = boards.filter((b) => b.sources.length > 1);
  console.log(`${collisions.length} models seen in more than one source`);
  for (const b of collisions.slice(0, 15)) {
    console.log(`  ${b.canonical_key}  <- ${b.sources.map((s) => s.source_key).join(', ')}`);
  }

  if (DRY_RUN) {
    console.log('\ndry run, nothing written');
    return;
  }

  const refs = { ...(await lookups()), makerCache: new Map(), shaperCache: new Map() };
  if (refs.sourceByKey.size === 0) {
    throw new Error('board_sources is empty - run the seeders before importing');
  }

  const stats = {
    created: 0, updated: 0, skipped_user_owned: 0,
    sources: 0, images: 0, unknown_source: new Set(),
  };
  const touched = [];

  for (const board of boards) {
    touched.push(await importBoard(board, refs, stats));
  }

  // user_boards documents denormalize boards.model and manufacturers.name, and
  // nothing reindexes them when the catalog changes - the hook only fires on a
  // UserBoard save. Without this an import leaves the index disagreeing with
  // MySQL for every board somebody owns.
  const affected = await db.UserBoard.findAll({ where: { board_id: touched }, raw: true });
  for (const ub of affected) getUserBoardQueue().push(ub);
  console.log(`queued ${affected.length} user_boards for reindex`);

  console.log(JSON.stringify({
    ...stats,
    unknown_source: [...stats.unknown_source],
  }, null, 2));
}

main()
  .then(() => setTimeout(() => process.exit(0), 7000))
  .catch((err) => { console.error(err); process.exit(1); });
