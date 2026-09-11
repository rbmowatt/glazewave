/*
 * Loads data/spot_localities.json into surfline_spots.city.
 *
 * An import, not a seeder. There is no seederStorage in this project, so
 * nothing records whether a seeder ran; this is written to be re-run instead -
 * over a re-harvest, or after the acceptance rule is widened - and a second run
 * over the same file changes nothing.
 *
 * Runs on the box, not the Mac: it needs sequelize, and `npm ci` in backend/
 * still fails on darwin-arm64. data/spot_localities.json is committed precisely
 * so `git pull` puts it there. The harvest half is reverse_geocode_spots.js,
 * which is dependency-free and runs on the Mac.
 *
 * THE ACCEPTANCE RULE LIVES HERE, not in the harvest. Default is containment:
 * the spot falls inside the bounding box of the feature Nominatim returned.
 * Distance to the returned point is not a substitute - for a municipality that
 * point is a centroid, so a spot well inside a large city reads as kilometres
 * away and a distance threshold alone would discard it.
 *
 * Run reverse_geocode_spots.js --report first and look at the spread before
 * widening anything. A wrong city is worse than no city: the region label
 * already works, and a break labelled with a town twenty kilometres inland is
 * a fact nobody can correct from the UI.
 *
 * Usage:
 *   node app/scripts/load_spot_localities.js --dry-run
 *   node app/scripts/load_spot_localities.js
 *   node app/scripts/load_spot_localities.js --also-within=2000
 *   node app/scripts/load_spot_localities.js --max-distance=25000
 *   node app/scripts/load_spot_localities.js --file=/path/to/spot_localities.json
 */

'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./../models');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};

const DRY_RUN = args.includes('--dry-run');
// Resolved from __dirname, not cwd: this gets pasted into an SSM session where
// the working directory is whatever the last command left behind.
const DEFAULT_FILE = path.join(__dirname, '..', '..', 'data', 'spot_localities.json');
const FILE = flag('file', DEFAULT_FILE);
const ALSO_WITHIN = Number(flag('also-within', 0)) || 0;
/*
 * A ceiling on accepted rows, containment notwithstanding. LEAVE IT OFF
 * unless something has changed: measured over the full harvest, only nine
 * accepted rows sit beyond 20km and inspection says most are right. Malibu
 * is a 34km strip city and takes three of them, Galveston covers its whole
 * island, Jacksonville is a consolidated city-county. Distance here is to
 * the returned feature's centroid, so a long thin municipality reads as
 * far away while the label is correct - a cap deletes true rows to catch
 * false ones, and REJECTED_KEYS catches the false ones directly.
 */
const MAX_DISTANCE = Number(flag('max-distance', 0)) || 0;
const SOURCE = flag('source', 'nominatim');

/*
 * A Mexican municipio, which is the same coarse administrative unit zoom 10
 * was returning for the whole country. Measured over the full 1,611-row
 * harvest it is exactly three rows, and two of them are the worst labels in
 * the set: Kanai in Riviera Maya answering as Playa del Carmen 55,866m away,
 * and Playa Xpu Ha as the same town at 28,509m. Both pass containment,
 * because a municipio boundary genuinely contains them.
 */
const REJECTED_KEYS = ['municipality'];

function accepted(row) {
  if (!row.city) return false;
  if (REJECTED_KEYS.includes(row.city_key)) return false;
  if (MAX_DISTANCE && Number.isFinite(row.feature_distance_m)
    && row.feature_distance_m > MAX_DISTANCE) return false;
  if (row.inside_bbox) return true;
  // Outside the boundary, so this is a nearest answer rather than a containing
  // one. Admitted only when the operator has named a distance and looked at
  // what it lets in.
  return ALSO_WITHIN > 0 && Number.isFinite(row.feature_distance_m)
    && row.feature_distance_m <= ALSO_WITHIN;
}

async function main() {
  if (!fs.existsSync(FILE)) {
    console.error(`no such file: ${FILE}`);
    console.error('run reverse_geocode_spots.js on the Mac and commit the result');
    process.exit(1);
  }

  const rows = JSON.parse(fs.readFileSync(FILE, 'utf8'));

  /*
   * Containment is only a valid signal while the returned feature IS the
   * settlement. Measured at zoom 16, Nominatim answers with the nearest road
   * or building instead - the address hierarchy still names the town, but the
   * bounding box is a road segment, so inside_bbox fell from 22/25 to 8/24 on
   * the same 30 spots. Loading a file like that under the default rule would
   * discard two thirds of a correct harvest and look like bad data.
   */
  const zooms = [...new Set(rows.map((r) => r.zoom).filter((z) => z !== undefined))];
  if (zooms.some((z) => Number(z) >= 16) && !ALSO_WITHIN && !MAX_DISTANCE) {
    console.error(`this file was harvested at zoom ${zooms.join(', ')}`);
    console.error('containment does not hold there - the returned feature is a road, not a town');
    console.error('re-harvest at zoom 14, or pass --also-within with a distance you have looked at');
    process.exit(1);
  }

  const take = rows.filter(accepted);

  console.log(`${rows.length} harvested, ${rows.filter((r) => r.city).length} with a locality`);
  console.log(`${take.length} accepted (inside bbox${ALSO_WITHIN ? `, or within ${ALSO_WITHIN}m` : ''}`
    + `${MAX_DISTANCE ? `, capped at ${MAX_DISTANCE}m` : ''})`);

  const ids = take.map((r) => r.id);
  const current = ids.length
    ? await db.sequelize.query(
        'SELECT id, city FROM surfline_spots WHERE id IN (:ids)',
        { replacements: { ids }, type: db.sequelize.QueryTypes.SELECT }
      )
    : [];
  const before = new Map(current.map((r) => [r.id, r.city]));

  const missing = ids.filter((id) => !before.has(id));
  if (missing.length) {
    // The seed file and the table can disagree: a spot may have been removed in
    // the trimming pass. Named rather than skipped silently, because the other
    // reason for this is loading a harvest built against a different seed.
    console.log(`${missing.length} harvested ids are not in the table, e.g. ${missing.slice(0, 3).join(', ')}`);
  }

  const changing = take.filter((r) => before.has(r.id) && before.get(r.id) !== r.city);
  console.log(`${changing.length} rows would change`);
  changing.slice(0, 10).forEach((r) =>
    console.log(`  ${r.name}: ${before.get(r.id) === null ? '(none)' : before.get(r.id)} -> ${r.city}`)
  );

  if (DRY_RUN) {
    console.log('dry run, nothing written');
    await db.sequelize.close();
    return;
  }

  let written = 0;
  for (const row of changing) {
    await db.sequelize.query(
      'UPDATE surfline_spots SET city = :city, locality_source = :source WHERE id = :id',
      { replacements: { city: row.city, source: SOURCE, id: row.id } }
    );
    written += 1;
  }

  console.log(`updated ${written} rows`);
  await db.sequelize.close();
}

main().catch(async (err) => {
  console.error(err);
  try { await db.sequelize.close(); } catch (e) { /* already closed */ }
  process.exit(1);
});
