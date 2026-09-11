/*
 * Fills crumbs and city on spots a rider contributed.
 *
 * The batch harvest covers the 1,611 seeded rows only - it reads
 * data/surfline_spots.json, which contributed spots are not in - and
 * SurflineSpotService.create only started resolving a locality after those
 * spots already existed. So they sit with NULL crumbs, which makes them the
 * only spots in the atlas with no locality label at all, not even a region.
 *
 * Runs on the box: it needs sequelize, and it needs egress to Nominatim.
 * One request per row at the policy's one-per-second, so this is seconds at
 * today's count. Re-runnable - it only touches rows still missing both.
 *
 * Usage:
 *   node app/scripts/backfill_contributed_localities.js --dry-run
 *   node app/scripts/backfill_contributed_localities.js
 */

'use strict';

require('dotenv').config();
const db = require('./../models');
const LocalityService = require('./../services/LocalityService');

const DRY_RUN = process.argv.includes('--dry-run');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const rows = await db.sequelize.query(
    `SELECT id, name, lat, lon FROM surfline_spots
      WHERE (crumbs IS NULL OR crumbs = '')
        AND lat IS NOT NULL AND lon IS NOT NULL AND lat <> '' AND lon <> ''
      ORDER BY id`,
    { type: db.sequelize.QueryTypes.SELECT }
  );

  console.log(`${rows.length} spots with no locality`);

  for (const row of rows) {
    const locality = await LocalityService.resolve(Number(row.lat), Number(row.lon));
    const label = [locality.city, locality.crumbs].filter(Boolean).join(' | ') || '(nothing)';
    console.log(`  ${row.name}: ${label}`);

    if (!DRY_RUN && (locality.crumbs || locality.city)) {
      await db.sequelize.query(
        `UPDATE surfline_spots
            SET crumbs = :crumbs, city = :city, locality_source = :source
          WHERE id = :id`,
        {
          replacements: {
            crumbs: locality.crumbs,
            city: locality.city,
            source: locality.locality_source,
            id: row.id,
          },
        }
      );
    }
    await sleep(1100);
  }

  console.log(DRY_RUN ? 'dry run, nothing written' : 'done');
  await db.sequelize.close();
}

main().catch(async (err) => {
  console.error(err);
  try { await db.sequelize.close(); } catch (e) { /* already closed */ }
  process.exit(1);
});
