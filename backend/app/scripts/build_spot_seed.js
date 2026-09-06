/*
 * Builds data/surfline_spots.json: every ocean-facing named beach and surf
 * feature on the US and Mexican coasts. Writes a file; touches no database and
 * no index.
 *
 * Why beaches and not surf breaks: OSM has roughly 1,200 sport=surfing
 * features worldwide and 15 in all of southern California, so breaks alone
 * cannot back the widget. Named beaches are mapped densely and carry real
 * coordinates, which beats hand-typed ones that fail silently by ranking the
 * wrong spot nearest.
 *
 * Two sources, on purpose:
 *   - OSM (Overpass) supplies the named features, one query per state.
 *   - GSHHG supplies the shoreline the geometry runs against.
 *
 * Shoreline came from OSM natural=coastline at first. It is the better-mapped
 * line, but scoring a feature needs every coastline way within the horizon, and
 * fetching that per tile ran 8MB and minutes per tile with margins that overlap
 * between neighbors. GSHHG is one 96MB file, parses in milliseconds, and its
 * full-resolution level-1 polygons still separate barrier islands from the
 * mainland - Long Beach Island is its own polygon - which is the only detail
 * this test actually depends on.
 *
 * Two geometric filters decide what survives:
 *
 *   1. the feature is within COAST_MAX_M of the ocean shoreline. GSHHG level 1
 *      is ocean coast only; lakes are level 2 and are not loaded, so lake,
 *      river and reservoir beaches are gone after this step alone.
 *
 *   2. from a probe point OFFSHORE_M seaward of that shoreline, at least
 *      OPEN_BINS_MIN of a 72-bearing sweep reach HORIZON_M without crossing
 *      land.
 *
 * Rule 2 is the ocean-facing test and it has to be measured in kilometers of
 * clear water, not by the name of the water body: Monterey Bay and Half Moon
 * Bay are open ocean, Barnegat Bay and La Paz are not. It also has to be run
 * from offshore, because a beach polygon's centroid sits landward of the
 * shoreline and every seaward ray from it crosses land immediately.
 *
 * Seaward is the right-hand normal: GSHHG winds land counter-clockwise, so
 * land is on the left of the direction of travel and water is on the right.
 *
 * OSM data is ODbL and GSHHG is LGPL. Anything published from this file needs
 * to credit OpenStreetMap contributors and Wessel and Smith's GSHHG.
 *
 * Dependency-free on purpose, so it runs from a bare checkout. The shoreline
 * file is downloaded on first run and both it and the Overpass responses are
 * cached under ~/.cache/glazewave (GLAZEWAVE_CACHE overrides). Not $TMPDIR:
 * macOS purges that after a few days and the download is 118MB. Delete the
 * cache to force a refetch.
 *
 * Usage:
 *   node build_spot_seed.js                 all regions, writes the seed
 *   node build_spot_seed.js US-NJ MX-BCS    only those regions
 *   node build_spot_seed.js --report US-NJ  per-feature scores, writes nothing
 *   node build_spot_seed.js --budget=120    stop cleanly after 120s, exit 3
 *
 * The budget exists because the only shells that can reach Overpass here are
 * capped at a few minutes and kill background jobs on exit. Every Overpass
 * response is cached before the next one is asked for, so rerunning with a
 * budget until it exits 0 walks the whole job forward without refetching.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');

// The main instance refuses connections outright once a client has used its
// quota, rather than answering 429, so a run that trips it needs somewhere
// else to go. All three carry the same data.
const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const OUT = path.join(__dirname, '../../data/surfline_spots.json');
const CACHE_ROOT = process.env.GLAZEWAVE_CACHE
  || path.join(os.homedir(), '.cache', 'glazewave');
const CACHE_DIR = path.join(CACHE_ROOT, 'overpass');
const GSHHG = process.env.GSHHG_BIN || path.join(CACHE_ROOT, 'gshhs_f.b');
const GSHHG_ZIP = 'https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-bin-2.3.7.zip';
const GSHHG_MEMBER = 'gshhs_f.b';

// Overpass rejects the default node User-Agent, and OSM policy asks callers to
// identify themselves.
const HEADERS = {
  'User-Agent': 'glazewave-spot-seed (+https://github.com/rbmowatt/glazewave)',
  'Accept': 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
};

// GSHHG full resolution is accurate to a couple of hundred meters and a beach
// centroid sits inland of the line, so this is looser than it looks.
const COAST_MAX_M = 1000;
const OFFSHORE_M = 400;
const HORIZON_M = 50000;
const BEARINGS = 72;
const OPEN_BINS_MIN = 12;
// Shoreline segments are bucketed into cells this size so a feature only scans
// the coast near it.
const CELL_DEG = 0.05;

const START = Date.now();
let BUDGET_S = 0;
const INCOMPLETE = Symbol('incomplete');
const outOfBudget = () => BUDGET_S > 0 && (Date.now() - START) / 1000 > BUDGET_S;

// Ocean coasts only. Great Lakes states are absent by design; a Lake Michigan
// beach has no ocean shoreline near it and would fail rule 1 anyway.
const REGIONS = [
  { iso: 'US-ME', country: 'United States', name: 'Maine' },
  { iso: 'US-NH', country: 'United States', name: 'New Hampshire' },
  { iso: 'US-MA', country: 'United States', name: 'Massachusetts' },
  { iso: 'US-RI', country: 'United States', name: 'Rhode Island' },
  { iso: 'US-CT', country: 'United States', name: 'Connecticut' },
  { iso: 'US-NY', country: 'United States', name: 'New York' },
  { iso: 'US-NJ', country: 'United States', name: 'New Jersey' },
  { iso: 'US-DE', country: 'United States', name: 'Delaware' },
  { iso: 'US-MD', country: 'United States', name: 'Maryland' },
  { iso: 'US-VA', country: 'United States', name: 'Virginia' },
  { iso: 'US-NC', country: 'United States', name: 'North Carolina' },
  { iso: 'US-SC', country: 'United States', name: 'South Carolina' },
  { iso: 'US-GA', country: 'United States', name: 'Georgia' },
  { iso: 'US-FL', country: 'United States', name: 'Florida' },
  { iso: 'US-AL', country: 'United States', name: 'Alabama' },
  { iso: 'US-MS', country: 'United States', name: 'Mississippi' },
  { iso: 'US-LA', country: 'United States', name: 'Louisiana' },
  { iso: 'US-TX', country: 'United States', name: 'Texas' },
  { iso: 'US-CA', country: 'United States', name: 'California' },
  { iso: 'US-OR', country: 'United States', name: 'Oregon' },
  { iso: 'US-WA', country: 'United States', name: 'Washington' },
  { iso: 'US-AK', country: 'United States', name: 'Alaska' },
  { iso: 'US-HI', country: 'United States', name: 'Hawaii' },
  { iso: 'MX-BCN', country: 'Mexico', name: 'Baja California' },
  { iso: 'MX-BCS', country: 'Mexico', name: 'Baja California Sur' },
  { iso: 'MX-SON', country: 'Mexico', name: 'Sonora' },
  { iso: 'MX-SIN', country: 'Mexico', name: 'Sinaloa' },
  { iso: 'MX-NAY', country: 'Mexico', name: 'Nayarit' },
  { iso: 'MX-JAL', country: 'Mexico', name: 'Jalisco' },
  { iso: 'MX-COL', country: 'Mexico', name: 'Colima' },
  { iso: 'MX-MIC', country: 'Mexico', name: 'Michoacan' },
  { iso: 'MX-GRO', country: 'Mexico', name: 'Guerrero' },
  { iso: 'MX-OAX', country: 'Mexico', name: 'Oaxaca' },
  { iso: 'MX-CHP', country: 'Mexico', name: 'Chiapas' },
  { iso: 'MX-TAM', country: 'Mexico', name: 'Tamaulipas' },
  { iso: 'MX-VER', country: 'Mexico', name: 'Veracruz' },
  { iso: 'MX-TAB', country: 'Mexico', name: 'Tabasco' },
  { iso: 'MX-CAM', country: 'Mexico', name: 'Campeche' },
  { iso: 'MX-YUC', country: 'Mexico', name: 'Yucatan' },
  { iso: 'MX-ROO', country: 'Mexico', name: 'Quintana Roo' },
];

// A surf shop or beachfront hotel passes both geometric tests, so the tags
// have to reject it. The parked Surfline seed shipped "Costa Azul Surf Shop"
// as a spot.
const REJECT_KEYS = ['shop', 'office', 'craft', 'club', 'healthcare'];
const REJECT_VALUES = {
  leisure: ['swimming_pool', 'water_park', 'sports_centre', 'fitness_centre',
    'river_surfing', 'marina'],
  tourism: ['hotel', 'motel', 'hostel', 'guest_house', 'apartment', 'chalet',
    'camp_site', 'caravan_site', 'resort'],
  amenity: true,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const overpass = async (key, query) => {
  const file = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (outOfBudget()) throw INCOMPLETE;

  // Overpass answers 429 when the caller has used its slot and 504 when the
  // query outruns the server's own budget; both are worth waiting out.
  const waits = [5000, 20000];
  for (let attempt = 0; ; attempt += 1) {
    const endpoint = MIRRORS[attempt % MIRRORS.length];
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: HEADERS,
      body: new URLSearchParams({ data: query }).toString(),
      signal: AbortSignal.timeout(300000),
    }).catch((e) => ({ status: 0, error: e }));

    if (res.status === 200) {
      const body = await res.json();
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(body));
      await sleep(2000);
      return body;
    }
    if (attempt >= waits.length) {
      console.log(`  ${key}: HTTP ${res.status} from ${endpoint} after ${attempt} retries`);
      return { elements: [], failed: true };
    }
    console.log(`  ${key}: HTTP ${res.status} from ${endpoint}, next mirror in ${waits[attempt] / 1000}s`);
    await sleep(waits[attempt]);
  }
};

// A whole-state area query times out on every public instance for anything the
// size of Maine, so features are asked for one tile at a time with the bbox
// first: Overpass narrows by bbox cheaply, then tests area membership on what
// little is left. Membership is still what assigns a spot to its state, so
// tiles overlapping a border cost nothing in correctness.
const TILE_FEAT_DEG = 2;
const MIN_TILE_DEG = 0.5;

const fetchBounds = async () => {
  const body = await overpass(
    'bounds',
    `[out:json][timeout:180];`
    + `(rel["ISO3166-2"~"^US-"]["admin_level"="4"];`
    + `rel["ISO3166-2"~"^MX-"]["admin_level"="4"];);`
    + `out bb;`
  );
  const out = {};
  for (const el of body.elements || []) {
    if (el.tags && el.bounds) out[el.tags['ISO3166-2']] = el.bounds;
  }
  return out;
};

let coastalCells = null;

const coastal = (size) => {
  if (coastalCells) return coastalCells;
  loadBuffer();
  const buf = shorelineBuffer;
  const cells = new Set();
  let off = 0;
  while (off + 44 <= buf.length) {
    const n = buf.readInt32BE(off + 4);
    const level = buf.readInt32BE(off + 8) & 255;
    const start = off + 44;
    off = start + n * 8;
    if (level !== 1 || n < 2) continue;
    for (let i = 0; i < n; i += 1) {
      const p = start + i * 8;
      let lon = buf.readInt32BE(p) / 1e6;
      if (lon > 180) lon -= 360;
      const lat = buf.readInt32BE(p + 4) / 1e6;
      cells.add(`${Math.floor(lat / size)}_${Math.floor(lon / size)}`);
    }
  }
  coastalCells = cells;
  return cells;
};

// Alaska's bounds run 172E to 130W, so the longitude range wraps and has to be
// walked in two pieces or it comes out empty.
const lonRange = (min, max, size) => {
  const steps = (a, b) => {
    const out = [];
    for (let i = Math.floor(a / size); i <= Math.floor(b / size); i += 1) out.push(i);
    return out;
  };
  return max < min
    ? steps(min, 180 - 1e-9).concat(steps(-180, max))
    : steps(min, max);
};

const tilesFor = (bb, size) => {
  const cells = coastal(size);
  const out = [];
  for (let y = Math.floor(bb.minlat / size); y <= Math.floor(bb.maxlat / size); y += 1) {
    for (const x of lonRange(bb.minlon, bb.maxlon, size)) {
      if (cells.has(`${y}_${x}`)) out.push({ s: y * size, w: x * size, size: size });
    }
  }
  return out;
};

const fetchTile = async (region, tile) => {
  const n = tile.s + tile.size;
  const e = tile.w + tile.size;
  const box = `${tile.s},${tile.w},${n},${e}`;
  const body = await overpass(
    `feat-${region.iso}-${tile.s}_${tile.w}-${tile.size}`,
    `[out:json][timeout:300];`
    + `area["ISO3166-2"="${region.iso}"]["admin_level"="4"]->.a;`
    + `(nwr["natural"="beach"]["name"](${box})(area.a);`
    + `nwr["sport"="surfing"]["name"](${box})(area.a););`
    + `out center tags;`
  );

  if (!body.failed) return body.elements || [];
  if (tile.size <= MIN_TILE_DEG) {
    console.log(`  ${region.iso} ${box}: giving up on this tile`);
    return [];
  }
  const half = tile.size / 2;
  let split = [];
  for (const dy of [0, half]) {
    for (const dx of [0, half]) {
      split = split.concat(
        await fetchTile(region, { s: tile.s + dy, w: tile.w + dx, size: half })
      );
    }
  }
  return split;
};

const fetchFeatures = async (region, bounds) => {
  const bb = bounds[region.iso];
  if (!bb) {
    console.log(`${region.iso}: no boundary in OSM, skipped`);
    return { elements: [] };
  }
  const tiles = tilesFor(bb, TILE_FEAT_DEG);
  const found = new Map();
  for (const tile of tiles) {
    for (const el of await fetchTile(region, tile)) found.set(`${el.type}/${el.id}`, el);
  }
  return { elements: [...found.values()], tiles: tiles.length };
};

// Minimal zip reader: pulling one member out of the archive beats shelling out
// to unzip, which is not installed by default on the server images this runs on.
const unzipMember = (zip, name) => {
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0 && i > zip.length - 66000; i -= 1) {
    if (zip.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip file');

  const count = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i += 1) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory');
    const method = zip.readUInt16LE(p + 10);
    const compressed = zip.readUInt32LE(p + 20);
    const nameLen = zip.readUInt16LE(p + 28);
    const extraLen = zip.readUInt16LE(p + 30);
    const commentLen = zip.readUInt16LE(p + 32);
    const localAt = zip.readUInt32LE(p + 42);
    const entry = zip.toString('utf8', p + 46, p + 46 + nameLen);
    if (entry === name || entry.endsWith(`/${name}`)) {
      const dataAt = localAt + 30
        + zip.readUInt16LE(localAt + 26) + zip.readUInt16LE(localAt + 28);
      const body = zip.subarray(dataAt, dataAt + compressed);
      return method === 0 ? body : zlib.inflateRawSync(body);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`${name} not found in archive`);
};

const ensureShoreline = async () => {
  if (fs.existsSync(GSHHG)) return;
  fs.mkdirSync(CACHE_ROOT, { recursive: true });
  console.log(`fetching shoreline data to ${GSHHG}, once, about 118MB`);
  const res = await fetch(GSHHG_ZIP, { signal: AbortSignal.timeout(600000) });
  if (!res.ok) {
    console.error(`shoreline download failed: HTTP ${res.status} from ${GSHHG_ZIP}`);
    process.exit(1);
  }
  const zip = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(GSHHG, unzipMember(zip, GSHHG_MEMBER));
  console.log(`extracted ${GSHHG_MEMBER}`);
};

let shorelineBuffer = null;

const loadBuffer = () => {
  if (!shorelineBuffer) shorelineBuffer = fs.readFileSync(GSHHG);
  return shorelineBuffer;
};

// Longitudes are carried in a shifted space so a region straddling the
// antimeridian - the Aleutians do - stays one contiguous range.
const shifter = (crosses) => (lon) => (crosses && lon < 0 ? lon + 360 : lon);

const loadShoreline = (box, crosses) => {
  const buf = loadBuffer();
  const shift = shifter(crosses);
  const segs = [];
  let off = 0;
  while (off + 44 <= buf.length) {
    const n = buf.readInt32BE(off + 4);
    const level = buf.readInt32BE(off + 8) & 255;
    const west = buf.readInt32BE(off + 12) / 1e6;
    const east = buf.readInt32BE(off + 16) / 1e6;
    const south = buf.readInt32BE(off + 20) / 1e6;
    const north = buf.readInt32BE(off + 24) / 1e6;
    const start = off + 44;
    off = start + n * 8;

    // level 1 is ocean shoreline; 2 is lakes, 3 islands in lakes, 4 ponds on
    // those islands, 5 and 6 Antarctic ice fronts.
    if (level !== 1 || n < 2) continue;
    if (north < box.s || south > box.n) continue;
    const pw = shift(west > 180 ? west - 360 : west);
    const pe = shift(east > 180 ? east - 360 : east);
    if (pe >= pw && (pe < box.w || pw > box.e)) continue;

    let px = null;
    let py = null;
    for (let i = 0; i < n; i += 1) {
      const p = start + i * 8;
      let lon = buf.readInt32BE(p) / 1e6;
      if (lon > 180) lon -= 360;
      lon = shift(lon);
      const lat = buf.readInt32BE(p + 4) / 1e6;
      if (px !== null) {
        const loS = Math.min(py, lat);
        const hiS = Math.max(py, lat);
        const loW = Math.min(px, lon);
        const hiW = Math.max(px, lon);
        if (hiS >= box.s && loS <= box.n && hiW >= box.w && loW <= box.e) {
          segs.push(py, px, lat, lon);
        }
      }
      px = lon;
      py = lat;
    }
  }
  return segs;
};

const buildIndex = (flat) => {
  const cells = new Map();
  const put = (lat, lon, i) => {
    const key = `${Math.floor(lat / CELL_DEG)}_${Math.floor(lon / CELL_DEG)}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(i);
    else cells.set(key, [i]);
  };
  for (let i = 0; i < flat.length; i += 4) {
    put(flat[i], flat[i + 1], i);
    put(flat[i + 2], flat[i + 3], i);
  }
  return { cells: cells, flat: flat };
};

const lookup = (index, lat, lon, reach) => {
  const padLat = reach / 111320;
  const padLon = padLat / Math.max(0.15, Math.cos((lat * Math.PI) / 180));
  const y0 = Math.floor((lat - padLat) / CELL_DEG);
  const y1 = Math.floor((lat + padLat) / CELL_DEG);
  const x0 = Math.floor((lon - padLon) / CELL_DEG);
  const x1 = Math.floor((lon + padLon) / CELL_DEG);
  const hit = new Set();
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const bucket = index.cells.get(`${y}_${x}`);
      if (bucket) for (const i of bucket) hit.add(i);
    }
  }
  return [...hit];
};

const project = (lat0, lon0) => {
  const mLat = 111320;
  const mLon = 111320 * Math.cos((lat0 * Math.PI) / 180);
  return (lat, lon) => [(lon - lon0) * mLon, (lat - lat0) * mLat];
};

// Squared distance from the origin to segment ab, plus the closest point and
// the segment direction, so callers can reuse it to place the offshore probe.
const nearestOnSegment = (ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : -(ax * dx + ay * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = ax + t * dx;
  const py = ay + t * dy;
  return { d2: px * px + py * py, px, py, dx, dy };
};

const norm = (a) => {
  const twoPi = Math.PI * 2;
  return ((a % twoPi) + twoPi) % twoPi;
};

const classify = (lat, lon, index) => {
  const to = project(lat, lon);
  const reach = HORIZON_M + OFFSHORE_M + COAST_MAX_M;
  const ids = lookup(index, lat, lon, reach);
  const flat = index.flat;

  let best = null;
  const near = [];
  for (const i of ids) {
    const [ax, ay] = to(flat[i], flat[i + 1]);
    const [bx, by] = to(flat[i + 2], flat[i + 3]);
    if (Math.min(ax, bx) > reach || Math.max(ax, bx) < -reach) continue;
    if (Math.min(ay, by) > reach || Math.max(ay, by) < -reach) continue;
    near.push([ax, ay, bx, by]);
    const n = nearestOnSegment(ax, ay, bx, by);
    if (!best || n.d2 < best.d2) best = n;
  }
  if (!best) return { coastM: Infinity, open: 0 };

  const coastM = Math.sqrt(best.d2);
  if (coastM > COAST_MAX_M) return { coastM, open: 0 };

  const segLen = Math.hypot(best.dx, best.dy) || 1;
  const ox = best.px + (best.dy / segLen) * OFFSHORE_M;
  const oy = best.py + (-best.dx / segLen) * OFFSHORE_M;

  const step = (Math.PI * 2) / BEARINGS;
  const blocked = new Array(BEARINGS).fill(false);
  for (const [ax, ay, bx, by] of near) {
    const a1x = ax - ox;
    const a1y = ay - oy;
    const b1x = bx - ox;
    const b1y = by - oy;
    if (nearestOnSegment(a1x, a1y, b1x, b1y).d2 > HORIZON_M * HORIZON_M) continue;
    // atan2(east, north) so bin 0 is due north and bins run clockwise.
    const t1 = norm(Math.atan2(a1x, a1y));
    const t2 = norm(Math.atan2(b1x, b1y));
    let sweep = t2 - t1;
    if (sweep > Math.PI) sweep -= Math.PI * 2;
    if (sweep < -Math.PI) sweep += Math.PI * 2;
    const bins = Math.max(1, Math.ceil(Math.abs(sweep) / step));
    for (let i = 0; i <= bins; i += 1) {
      blocked[Math.floor(norm(t1 + (sweep * i) / bins) / step) % BEARINGS] = true;
    }
  }
  return { coastM, open: blocked.filter((b) => !b).length };
};

const rejected = (tags) => {
  if (REJECT_KEYS.some((k) => tags[k])) return true;
  for (const [k, v] of Object.entries(REJECT_VALUES)) {
    if (!tags[k]) continue;
    if (v === true || v.includes(tags[k])) return true;
  }
  return false;
};

const toRow = (el, region) => {
  const lat = el.lat !== undefined ? el.lat : el.center && el.center.lat;
  const lon = el.lon !== undefined ? el.lon : el.center && el.center.lon;
  if (lat === undefined || lon === undefined) return null;
  return {
    // The <source>:<native id> convention the contribution migration defines.
    id: `osm:${el.type}/${el.id}`,
    name: el.tags.name,
    crumbs: `${region.country}, ${region.name}`,
    cams: null,
    state_id: null,
    county: el.tags['addr:county'] || null,
    // stored as strings to match the varchar columns the table already uses
    lat: String(lat),
    lon: String(lon),
    url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    source: 'osm',
  };
};

const run = async () => {
  const args = process.argv.slice(2);
  const report = args.includes('--report');
  const budget = args.find((a) => a.startsWith('--budget='));
  if (budget) BUDGET_S = Number(budget.split('=')[1]);
  const picked = args.filter((a) => !a.startsWith('--'));
  const regions = picked.length
    ? REGIONS.filter((r) => picked.includes(r.iso))
    : REGIONS;

  await ensureShoreline();
  const bounds = await fetchBounds();

  const rows = [];
  let examined = 0;
  for (const region of regions) {
    const body = await fetchFeatures(region, bounds);
    const candidates = (body.elements || [])
      .filter((el) => el.tags && el.tags.name && !rejected(el.tags))
      .map((el) => ({ el: el, row: toRow(el, region) }))
      .filter((c) => c.row);
    examined += candidates.length;
    if (!candidates.length) {
      console.log(`${region.iso}: no candidates`);
      continue;
    }

    const lons = candidates.map((c) => Number(c.row.lon));
    const crosses = Math.max(...lons) - Math.min(...lons) > 180;
    const shift = shifter(crosses);
    const lats = candidates.map((c) => Number(c.row.lat));
    const sl = lons.map(shift);
    const pad = (HORIZON_M * 1.5) / 111320;
    const box = {
      s: Math.min(...lats) - pad,
      n: Math.max(...lats) + pad,
      w: Math.min(...sl) - pad * 4,
      e: Math.max(...sl) + pad * 4,
    };
    const index = buildIndex(loadShoreline(box, crosses));

    let kept = 0;
    for (const c of candidates) {
      const { coastM, open } = classify(
        Number(c.row.lat), shift(Number(c.row.lon)), index
      );
      const ok = coastM <= COAST_MAX_M && open >= OPEN_BINS_MIN;
      if (report) {
        console.log(
          `${ok ? 'keep' : 'drop'}\t${Math.round(coastM)}m\t${open}/${BEARINGS}`
          + `\t${c.row.name}\t${c.row.lat},${c.row.lon}`
        );
      }
      if (ok) {
        rows.push(c.row);
        kept += 1;
      }
    }
    console.log(`${region.iso}: ${candidates.length} candidates, ${kept} ocean-facing, ${body.tiles} tiles`);
  }

  if (report) {
    console.log(`\n${examined} examined, ${rows.length} kept`);
    return;
  }

  const seen = new Set();
  const deduped = rows
    .filter((row) => {
      // same beach mapped as both a node and an area would otherwise appear twice
      const key = `${row.name}|${Number(row.lat).toFixed(4)}|${Number(row.lon).toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.crumbs.localeCompare(b.crumbs) || a.name.localeCompare(b.name));

  fs.writeFileSync(OUT, JSON.stringify(deduped, null, 2) + '\n');
  console.log(`\nwrote ${deduped.length} spots to data/surfline_spots.json`);
  console.log('review it before seeding, then: npx sequelize-cli db:seed --seed 20200623150000-surfline_spots.js');
};

run().catch((e) => {
  if (e !== INCOMPLETE) throw e;
  console.log('INCOMPLETE: budget spent, rerun to continue from cache');
  process.exit(3);
});
