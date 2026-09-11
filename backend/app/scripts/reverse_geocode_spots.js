/*
 * Builds data/spot_localities.json: a reverse-geocoded locality for every spot
 * in data/surfline_spots.json. Writes a file; touches no database.
 *
 * Why this exists: the atlas has no city. Measured across all 1,611 seeded
 * rows, `county` and `state_id` are populated on none of them and `crumbs` is
 * "Country, Region" on every one - so "East 83rd Street" can be labelled
 * New Jersey and nothing finer. Two spots a mile apart in different towns read
 * as the same place.
 *
 * Nominatim is the source because the spots came from OSM in the first place,
 * so it adds no licensing obligation the existing OPENSTREETMAP CONTRIBUTORS
 * credit does not already cover. Its usage policy caps automated use at one
 * request per second and requires a User-Agent that identifies the caller and
 * a way to reach them; both are honoured below. Do not widen the rate to make
 * this finish sooner - a bulk job hammering the public instance is the exact
 * thing that policy exists to stop, and the block is by IP.
 *
 * Dependency-free on purpose. `npm ci` in backend/ still fails on darwin-arm64
 * (sharp 0.30.7 ships no prebuild), so anything that has to run on the Mac gets
 * global fetch and nothing else. The DB half is load_spot_localities.js, which
 * needs sequelize and therefore runs on the box.
 *
 * THIS SCRIPT DECIDES NOTHING. It records what Nominatim answered and the two
 * facts needed to judge the answer later - the distance to the returned
 * feature's point, and whether the spot falls inside its bounding box. A surf
 * spot is frequently offshore or on an unnamed stretch of sand, and a locality
 * accepted blindly is how a break ends up labelled with a town twenty
 * kilometres inland, which is worse than the region label that already works.
 * Run --report, look at the spread, then pick the rule the loader enforces.
 *
 * Usage:
 *   node app/scripts/reverse_geocode_spots.js --limit=25
 *   node app/scripts/reverse_geocode_spots.js --limit=25 --zoom=16 --out=z16.json
 *   node app/scripts/reverse_geocode_spots.js
 *   node app/scripts/reverse_geocode_spots.js --report
 *   node app/scripts/reverse_geocode_spots.js --report --out=z16.json
 */

'use strict';

const fs = require('fs');
const path = require('path');

const UA =
  'glazewave-spot-locality/1.0 (https://glazewave.com; richmowatt@gmail.com)';

const DATA_DIR = path.resolve(__dirname, '../../data');
const SEED_FILE = path.join(DATA_DIR, 'surfline_spots.json');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};
const REPORT = args.includes('--report');
const LIMIT = Number(flag('limit', 0)) || 0;
const OUT_FILE = path.resolve(DATA_DIR, flag('out', 'spot_localities.json'));
/*
 * Reverse zoom picks which level of the hierarchy answers. 10 is city level
 * and in Mexico that returns the municipio rather than the settlement -
 * Municipio de Ensenada is 52,000 km2, so a break 200km up the coast comes
 * back named for a city it is nowhere near. Kept a flag so two zooms can be
 * measured against the same 25 rows rather than argued about.
 */
const ZOOM = Number(flag('zoom', 10));
/*
 * --limit takes the head of the file, and the head of this file is entirely
 * Baja California - it is sorted by crumbs. A 25-row trial taken that way
 * measures one country's administrative hierarchy and says nothing about the
 * 1,400-odd US rows behind it. --sample strides the whole file instead.
 */
const SAMPLE = Number(flag('sample', 0)) || 0;

// One request per second is the ceiling, so this is the floor plus a margin for
// clock drift. Everything else about the runtime follows from it: 1,611 rows is
// about thirty minutes.
const INTERVAL_MS = 1100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/*
 * Finest first. Nominatim fills whichever of these the place actually has, and
 * an unincorporated stretch of coast often has only `hamlet` or `suburb` - or
 * none of them, which is a legitimate answer and not a failure.
 */
const CITY_KEYS = ['city', 'town', 'village', 'hamlet', 'municipality', 'suburb'];

const EARTH_M = 6371000;
function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * EARTH_M * Math.asin(Math.sqrt(a)));
}

async function reverse(lat, lon) {
  const url =
    'https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1' +
    `&zoom=${ZOOM}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;

  /*
   * Five attempts with a widening wait. A 429 here means the rate limit has
   * already been tripped, so backing off further is the only correct response;
   * retrying at the same cadence is what turns a throttle into a ban.
   */
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    throw new Error(`reverse failed ${res.status}`);
  }
  throw new Error('throttled after 5 attempts');
}

function readExisting() {
  if (!fs.existsSync(OUT_FILE)) return [];
  return JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
}

function report(rows) {
  const byKey = {};
  rows.forEach((r) => {
    const k = r.city_key || 'NONE';
    byKey[k] = (byKey[k] || 0) + 1;
  });
  // Which fields the empty rows DO carry. Without this the only way to tell
  // an offshore point from a settlement this script is not reading is to
  // spend the rate limit again.
  const gaps = {};
  rows.filter((r) => !r.city).forEach((r) => {
    const present = Object.keys(r.address || {}).sort().join('+') || '(empty)';
    gaps[present] = (gaps[present] || 0) + 1;
  });
  const withCity = rows.filter((r) => r.city);
  const inside = withCity.filter((r) => r.inside_bbox);
  const distances = withCity
    .map((r) => r.feature_distance_m)
    .filter((d) => Number.isFinite(d))
    .sort((a, b) => a - b);
  const pct = (p) =>
    distances.length ? distances[Math.floor((distances.length - 1) * p)] : null;

  console.log(`rows            ${rows.length}`);
  console.log(`zoom            ${[...new Set(rows.map((r) => r.zoom))].join(', ')}`);
  console.log(`with a locality ${withCity.length}`);
  console.log(`inside its bbox ${inside.length}`);
  console.log(`offshore        ${rows.filter((r) => r.country_only).length} (country polygon, no locality exists)`);
  console.log('by address key  ' + JSON.stringify(byKey));
  console.log('');
  const byRegion = {};
  rows.forEach((r) => {
    const region = (r.address && (r.address.state || r.address.country)) || 'unknown';
    if (!byRegion[region]) byRegion[region] = { n: 0, city: 0 };
    byRegion[region].n += 1;
    if (r.city) byRegion[region].city += 1;
  });
  console.log('Hit rate by region, which is what a head-of-file sample hides:');
  Object.entries(byRegion)
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 15)
    .forEach(([region, v]) => console.log(`  ${String(v.city).padStart(4)}/${String(v.n).padEnd(4)} ${region}`));
  console.log('');
  console.log('What the rows WITHOUT a locality do carry:');
  Object.entries(gaps)
    .sort((a, b) => b[1] - a[1])
    .forEach(([fields, n]) => console.log(`  ${String(n).padStart(4)}  ${fields}`));
  console.log('');
  console.log(
    'distance to the returned feature, metres: ' +
      `p50 ${pct(0.5)}  p90 ${pct(0.9)}  p99 ${pct(0.99)}  max ${distances[distances.length - 1]}`
  );
  console.log('');
  console.log('Ten furthest, which are the ones a threshold has to exclude:');
  withCity
    .slice()
    .sort((a, b) => b.feature_distance_m - a.feature_distance_m)
    .slice(0, 10)
    .forEach((r) =>
      console.log(`  ${String(r.feature_distance_m).padStart(9)}m  ${r.name} -> ${r.city}`)
    );
}

async function main() {
  const done = readExisting();

  if (REPORT) {
    if (!done.length) {
      console.error(`nothing to report on - ${OUT_FILE} is empty or absent`);
      process.exit(1);
    }
    report(done);
    return;
  }

  const spots = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  // Resumable by id: thirty minutes is long enough that a laptop sleeping or a
  // dropped connection is likely, and starting over would mean spending the
  // rate limit twice on rows already answered.
  const seen = new Set(done.map((r) => r.id));
  const todo = spots.filter((s) => !seen.has(s.id));
  let batch = todo;
  if (SAMPLE) {
    const stride = Math.max(1, Math.floor(todo.length / SAMPLE));
    batch = todo.filter((_, i) => i % stride === 0).slice(0, SAMPLE);
  } else if (LIMIT) {
    batch = todo.slice(0, LIMIT);
  }

  console.log(`${spots.length} spots, ${done.length} already done, ${batch.length} to fetch`);
  if (!batch.length) return;
  console.log(`about ${Math.ceil((batch.length * INTERVAL_MS) / 60000)} minutes at one per second`);

  const out = done.slice();
  for (let i = 0; i < batch.length; i += 1) {
    const spot = batch[i];
    const lat = Number(spot.lat);
    const lon = Number(spot.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    let row;
    try {
      const data = await reverse(lat, lon);
      const address = (data && data.address) || {};
      const key = CITY_KEYS.find((k) => address[k]);
      const fLat = Number(data && data.lat);
      const fLon = Number(data && data.lon);
      // [south, north, west, east] as strings.
      const bb = (data && data.boundingbox) || [];
      const inside =
        bb.length === 4 &&
        lat >= Number(bb[0]) && lat <= Number(bb[1]) &&
        lon >= Number(bb[2]) && lon <= Number(bb[3]);

      row = {
        id: spot.id,
        name: spot.name,
        lat: lat,
        lon: lon,
        city: key ? address[key] : null,
        city_key: key || null,
        /*
         * The whole hierarchy, not the four fields the first pass kept. That
         * version recorded city/county/state/country and threw the rest away,
         * so working out why 21 of 25 came back empty needed a re-fetch -
         * thirty minutes of rate limit to answer a question the response had
         * already answered. Rows are small; the budget is the scarce thing.
         */
        address: address,
        zoom: ZOOM,
        /*
         * place_rank 4 with no state is the country polygon: the point is in
         * the water, outside every administrative boundary, and Nominatim has
         * fallen all the way back. Eight of the first 25 came back this way -
         * 'Mexico' and nothing else. Not a locality, and no zoom recovers it.
         */
        country_only: Boolean(data) && !address.state && Number(data.place_rank) <= 5,
        place_rank: data ? data.place_rank : null,
        category: data ? data.category : null,
        type: data ? data.type : null,
        display_name: data ? data.display_name : null,
        /*
         * Distance to the point Nominatim returned, which for a municipality is
         * its centroid - so this is NOT the distance to its edge. A spot well
         * inside a large city can sit ten kilometres from the centroid and a
         * threshold alone would throw it away. inside_bbox is the containment
         * signal; the distance is for ranking what to look at.
         */
        feature_distance_m:
          Number.isFinite(fLat) && Number.isFinite(fLon)
            ? haversine(lat, lon, fLat, fLon)
            : null,
        inside_bbox: inside,
      };
    } catch (err) {
      row = { id: spot.id, name: spot.name, lat: lat, lon: lon, city: null, error: err.message };
    }

    out.push(row);

    // Flushed every 25 rows rather than at the end, for the same reason the run
    // resumes: an interrupted job must not cost the whole rate-limit budget.
    if (out.length % 25 === 0 || i === batch.length - 1) {
      fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
      process.stdout.write(`\r${out.length} written`);
    }
    await sleep(INTERVAL_MS);
  }

  console.log('');
  console.log(`wrote ${OUT_FILE}`);
  report(out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
