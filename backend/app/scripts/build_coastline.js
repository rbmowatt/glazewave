/*
 * Builds backend/data/coastline.bin: the ocean shoreline for the regions the
 * spot seed covers, small enough to ship in the repo and to read a few
 * kilobytes at a time on the box.
 *
 * Why a committed extract rather than GSHHG itself: gshhs_f.b is 96MB and the
 * script that reads it does fs.readFileSync, which is fine for a script that
 * exits and wrong for a long-lived API. The box idles with ~320MB available
 * and 400MB of swap already in use.
 *
 * Resolution is GSHHG high, not full. Full is 1.22M segments (18.6MB) across
 * these regions against 173k (2.6MB) for high, and the two return identical
 * verdicts on every control point tested - Harvey Cedars, Ship Bottom, Chadwick
 * Beach, Playa El Tecolote, Manhattan, Times Square, Newark, Toms River,
 * Denver. A 1000m proximity test cannot tell 200m of coastline detail apart.
 *
 * GSHHG is LGPL and needs crediting alongside OpenStreetMap wherever spots
 * derived from it are published.
 *
 * Dependency-free on purpose, so it runs from a bare checkout the way the spot
 * seed does.
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT = path.join(__dirname, '../../data/coastline.bin');
const MANIFEST = path.join(__dirname, '../../data/coastline.manifest.json');
// The bucket policy already serves this prefix public-read, so the box fetches
// it over plain https with no credentials and no SDK.
const URL_BASE = process.env.COASTLINE_URL_BASE
  || 'https://glazewave-uploads-124666675445.s3.amazonaws.com/data';
const CACHE_ROOT = process.env.GLAZEWAVE_CACHE
  || path.join(os.homedir(), '.cache', 'glazewave');
const GSHHG = process.env.GSHHG_BIN || path.join(CACHE_ROOT, 'gshhs_h.b');
const GSHHG_ZIP = 'https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-bin-2.3.7.zip';

/*
 * Coarse boxes covering every region in build_spot_seed.js REGIONS. Coarse on
 * purpose: a box that overshoots costs a few hundred kilobytes of coastline,
 * and a box that undershoots silently makes a real beach unverifiable.
 *
 * Anything outside these boxes has no shoreline data at all, and the service
 * answers "unknown" rather than guessing. Adding a coast means adding a box
 * here and regenerating.
 */
const BOXES = [
  { name: 'conus', s: 24, n: 50, w: -128, e: -66 },
  { name: 'alaska', s: 51, n: 72, w: -180, e: -129 },
  // The Aleutians run past the antimeridian, so they need their own box in
  // positive longitude rather than a wrapped one.
  { name: 'aleutians', s: 50, n: 56, w: 172, e: 180 },
  { name: 'hawaii', s: 18, n: 23, w: -161, e: -154 },
  { name: 'mexico', s: 14, n: 33, w: -118, e: -86 },
];

// One degree, not the 0.05 the in-memory grid uses. The open-water test reaches
// ~51km, so a fine on-disk cell would mean hundreds of positioned reads per
// query; at one degree it is four.
const CELL_DEG = 1;
const MAGIC = 'GWCL';
const VERSION = 1;
const HEADER_BYTES = 32;
const INDEX_ENTRY_BYTES = 12;
const SEGMENT_BYTES = 16;

const inAnyBox = (lat, lon) =>
  BOXES.some((b) => lat >= b.s && lat <= b.n && lon >= b.w && lon <= b.e);

const ensureShoreline = async () => {
  if (fs.existsSync(GSHHG)) return;
  fs.mkdirSync(path.dirname(GSHHG), { recursive: true });
  const zip = path.join(path.dirname(GSHHG), 'gshhg.zip');
  console.log(`fetching shoreline data, once, about 118MB`);
  const res = await fetch(GSHHG_ZIP, { signal: AbortSignal.timeout(600000) });
  if (!res.ok) throw new Error(`GSHHG download failed: HTTP ${res.status}`);
  fs.writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
  // unzip rather than a zlib hand-roll: the archive is stored with entries this
  // script has no other reason to understand.
  execFileSync('unzip', ['-o', '-j', zip, '*gshhs_h.b', '-d', path.dirname(GSHHG)]);
  fs.unlinkSync(zip);
};

/*
 * GSHHG is a flat sequence of 44-byte polygon headers each followed by n
 * 8-byte points, all big-endian microdegrees. Level 1 is ocean shoreline; 2 is
 * lakes, 3 islands in lakes, 4 ponds on those islands, 5 and 6 Antarctic ice.
 * Only level 1 answers "does this land touch the ocean".
 */
const extract = (buf) => {
  const segs = [];
  let off = 0;
  while (off + 44 <= buf.length) {
    const n = buf.readInt32BE(off + 4);
    const level = buf.readInt32BE(off + 8) & 255;
    let west = buf.readInt32BE(off + 12) / 1e6;
    let east = buf.readInt32BE(off + 16) / 1e6;
    const south = buf.readInt32BE(off + 20) / 1e6;
    const north = buf.readInt32BE(off + 24) / 1e6;
    const start = off + 44;
    off = start + n * 8;

    if (level !== 1 || n < 2) continue;
    if (west > 180) west -= 360;
    if (east > 180) east -= 360;
    if (!BOXES.some((b) => north >= b.s && south <= b.n && east >= b.w && west <= b.e)) continue;

    let px = null;
    let py = null;
    for (let i = 0; i < n; i += 1) {
      const p = start + i * 8;
      let lon = buf.readInt32BE(p) / 1e6;
      if (lon > 180) lon -= 360;
      const lat = buf.readInt32BE(p + 4) / 1e6;
      // Either endpoint inside a box keeps the segment, so a segment crossing
      // the boundary is not dropped from the side that needs it.
      if (px !== null && (inAnyBox(lat, lon) || inAnyBox(py, px))) {
        segs.push([py, px, lat, lon]);
      }
      px = lon;
      py = lat;
    }
  }
  return segs;
};

const cellOf = (lat, lon) => [Math.floor(lat / CELL_DEG), Math.floor(lon / CELL_DEG)];

const run = async () => {
  await ensureShoreline();
  console.log('reading ' + GSHHG);
  const segs = extract(fs.readFileSync(GSHHG));
  console.log('segments in range: ' + segs.length.toLocaleString());

  // Bucketed by the first endpoint. A segment straddling a cell boundary lands
  // in one of the two, which is why the reader widens its cell range by one.
  const buckets = new Map();
  for (const s of segs) {
    const key = cellOf(s[0], s[1]).join(',');
    const b = buckets.get(key);
    if (b) b.push(s);
    else buckets.set(key, [s]);
  }

  const keys = [...buckets.keys()].sort();
  const data = Buffer.alloc(segs.length * SEGMENT_BYTES);
  const index = Buffer.alloc(keys.length * INDEX_ENTRY_BYTES);
  let at = 0;
  let ix = 0;
  keys.forEach((key) => {
    const [y, x] = key.split(',').map(Number);
    const bucket = buckets.get(key);
    index.writeInt16BE(y, ix); index.writeInt16BE(x, ix + 2);
    index.writeUInt32BE(at / SEGMENT_BYTES, ix + 4);
    index.writeUInt32BE(bucket.length, ix + 8);
    ix += INDEX_ENTRY_BYTES;
    for (const s of bucket) {
      data.writeInt32BE(Math.round(s[0] * 1e6), at);
      data.writeInt32BE(Math.round(s[1] * 1e6), at + 4);
      data.writeInt32BE(Math.round(s[2] * 1e6), at + 8);
      data.writeInt32BE(Math.round(s[3] * 1e6), at + 12);
      at += SEGMENT_BYTES;
    }
  });

  const header = Buffer.alloc(HEADER_BYTES);
  header.write(MAGIC, 0, 'ascii');
  header.writeUInt16BE(VERSION, 4);
  header.writeUInt16BE(CELL_DEG, 6);
  header.writeUInt32BE(segs.length, 8);
  header.writeUInt32BE(keys.length, 12);
  header.writeUInt32BE(HEADER_BYTES, 16);
  header.writeUInt32BE(HEADER_BYTES + data.length, 20);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.concat([header, data, index]));
  const bytes = fs.statSync(OUT).size;

  /*
   * Written here rather than by hand, because the manifest is what the deploy
   * trusts: a hash that does not match the file it names sends every box into
   * a download loop that can never succeed.
   */
  const previous = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
    : {};
  fs.writeFileSync(MANIFEST, JSON.stringify({
    url: previous.url || `${URL_BASE}/coastline.bin`,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(OUT)).digest('hex'),
    bytes: bytes,
    segments: segs.length,
    cells: keys.length,
    built: new Date().toISOString().slice(0, 10),
    source: 'GSHHG 2.3.7 gshhs_h.b, level 1, LGPL, Wessel and Smith',
    regions: BOXES.map((b) => b.name),
  }, null, 2) + '\n');

  console.log(`wrote ${OUT}`);
  console.log(`${keys.length} cells, ${(bytes / 1048576).toFixed(2)} MB`);
  console.log('manifest updated; upload the .bin before deploying it');
};

run().catch((e) => { console.error(e.message); process.exit(1); });
