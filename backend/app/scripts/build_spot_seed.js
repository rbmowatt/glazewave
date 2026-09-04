/*
 * Builds data/surfline_spots.json from OpenStreetMap. Writes a file; touches
 * no database and no index.
 *
 * Why beaches and not surf breaks: OSM has roughly 1,200 sport=surfing
 * features worldwide and 15 in all of southern California, so breaks alone
 * cannot back the widget. Named beaches are mapped densely and carry real
 * coordinates, which beats hand-typed ones that fail silently by ranking the
 * wrong spot nearest.
 *
 * OSM data is ODbL. Anything published from this file needs to credit
 * OpenStreetMap contributors.
 *
 * Dependency-free on purpose, so it runs from a bare checkout.
 */
const fs = require('fs');
const path = require('path');

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const OUT = path.join(__dirname, '../../data/surfline_spots.json');

// Overpass rejects the default node User-Agent, and OSM policy asks callers to
// identify themselves.
const HEADERS = {
  'User-Agent': 'glazewave-spot-seed (+https://github.com/rbmowatt/glazewave)',
  'Accept': 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
};

// south, west, north, east
const REGIONS = [
  { name: 'New Jersey', bbox: '38.85,-75.60,40.55,-73.90' },
  { name: 'Baja California Sur', bbox: '22.70,-110.60,24.60,-109.30' },
];

const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const fetchRegion = async (region) => {
  const query = `[out:json][timeout:180];(nwr["natural"="beach"]["name"](${region.bbox});nwr["sport"="surfing"]["name"](${region.bbox}););out center;`;
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: HEADERS,
    body: new URLSearchParams({ data: query }).toString(),
    signal: AbortSignal.timeout(200000),
  });
  if (res.status !== 200) {
    console.log(`${region.name}: HTTP ${res.status}, skipped`);
    return [];
  }
  const body = await res.json();
  const elements = (body && body.elements) || [];
  console.log(`${region.name}: ${elements.length} elements`);
  return elements.map((el) => ({ el: el, region: region.name }));
};

const toRow = ({ el, region }) => {
  // ways and relations carry their coordinates under center, nodes do not
  const lat = el.lat !== undefined ? el.lat : (el.center && el.center.lat);
  const lon = el.lon !== undefined ? el.lon : (el.center && el.center.lon);
  if (lat === undefined || lon === undefined) return null;

  const name = el.tags.name;
  return {
    id: `${slug(name)}-${el.type[0]}${el.id}`,
    name: name,
    crumbs: region,
    cams: null,
    state_id: null,
    county: el.tags['addr:county'] || null,
    // stored as strings to match the varchar columns the table already uses
    lat: String(lat),
    lon: String(lon),
    url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
  };
};

const run = async () => {
  let found = [];
  for (const region of REGIONS) {
    found = found.concat(await fetchRegion(region));
  }

  const seen = new Set();
  const rows = found
    .map(toRow)
    .filter(Boolean)
    .filter((row) => {
      // same beach mapped as both a node and an area would otherwise appear twice
      const key = `${row.name}|${Number(row.lat).toFixed(4)}|${Number(row.lon).toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(OUT, JSON.stringify(rows, null, 2) + '\n');
  console.log(`\nwrote ${rows.length} spots to data/surfline_spots.json`);
  console.log('review it before seeding, then: npx sequelize-cli db:seed --seed 20200623150000-surfline_spots.js');
};

run();
