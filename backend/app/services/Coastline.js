/*
 * Answers "is this point on a piece of land that touches open ocean".
 *
 * Two tests, both from build_spot_seed.js, which is what filtered every row
 * currently in surfline_spots. Captured spots have to clear the same bar as
 * seeded ones or the table stops meaning one thing.
 *
 *   1. within COAST_MAX_M of level-1 (ocean) shoreline
 *   2. from a probe OFFSHORE_M seaward of that shoreline, at least
 *      OPEN_BINS_MIN of BEARINGS directions reach HORIZON_M without crossing
 *      land
 *
 * Rule 2 is what separates an ocean beach from a bayside one at the same
 * distance from water. A lagoon blocks every bearing.
 *
 * ONE DELIBERATE DIFFERENCE from the seed: the seed probes seaward of the
 * single nearest segment. This tries the CANDIDATES nearest and keeps the best.
 * The seed scores named beach features, whose point sits on the beach. This
 * scores geocoded addresses, whose point sits mid-street - and on a barrier
 * island the nearest shoreline to a street is often the bay. Measured, East
 * 83rd Street in Harvey Cedars is 265m from ocean shoreline and scored 0 open
 * bearings under the seed's rule, because the probe landed in Barnegat Bay.
 * Under this rule it scores 37. Times Square, Newark, Toms River and Denver
 * still fail, and both seeded controls still pass.
 *
 * Data is backend/data/coastline.bin, built by scripts/build_coastline.js.
 * Read a cell at a time through a file descriptor rather than loaded whole:
 * the box idles near 320MB available with swap already in use.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const FILE = process.env.COASTLINE_BIN
  || path.join(__dirname, '../../data/coastline.bin');

const MAGIC = 'GWCL';
const HEADER_BYTES = 32;
const INDEX_ENTRY_BYTES = 12;
const SEGMENT_BYTES = 16;

const COAST_MAX_M = 1000;
const OFFSHORE_M = 400;
const HORIZON_M = 50000;
const BEARINGS = 72;
const OPEN_BINS_MIN = 12;
// Raising this rejects real spots before it rejects harbours: Playa El
// Tecolote, which is seeded and surfed, scores 13.
const CANDIDATES = 8;

// Fine grid for the in-memory nearest lookup, independent of the one-degree
// cells the file is bucketed by.
const GRID_DEG = 0.05;
const REACH_M = HORIZON_M + OFFSHORE_M + COAST_MAX_M;

// Loaded one-degree cells. Coastal cells run a few hundred segments, so this
// is tens of kilobytes rather than the 96MB the source dataset would cost.
const CACHE_MAX = 24;
const cache = new Map();

let fd = null;
let index = null;
let cellDeg = 1;

const open = () => {
    if (fd !== null) return;
    if (!fs.existsSync(FILE)) {
        // Not committed: it is 2.6MB and regenerating it writes a different
        // file. `npm run coastline:fetch` pulls the one the manifest names.
        throw new Error(`${FILE} is missing; run npm run coastline:fetch`);
    }
    fd = fs.openSync(FILE, 'r');
    const header = Buffer.alloc(HEADER_BYTES);
    fs.readSync(fd, header, 0, HEADER_BYTES, 0);
    if (header.toString('ascii', 0, 4) !== MAGIC) {
        throw new Error('coastline.bin is not a coastline file');
    }
    cellDeg = header.readUInt16BE(6);
    const cells = header.readUInt32BE(12);
    const dataOffset = header.readUInt32BE(16);
    const indexOffset = header.readUInt32BE(20);

    const raw = Buffer.alloc(cells * INDEX_ENTRY_BYTES);
    fs.readSync(fd, raw, 0, raw.length, indexOffset);
    index = new Map();
    for (let i = 0; i < cells; i += 1) {
        const at = i * INDEX_ENTRY_BYTES;
        index.set(`${raw.readInt16BE(at)},${raw.readInt16BE(at + 2)}`, {
            offset: dataOffset + raw.readUInt32BE(at + 4) * SEGMENT_BYTES,
            count: raw.readUInt32BE(at + 8),
        });
    }
};

const readCell = (key) => {
    const hit = cache.get(key);
    if (hit) {
        // Re-insert so the eviction below drops the least recently used.
        cache.delete(key);
        cache.set(key, hit);
        return hit;
    }
    const entry = index.get(key);
    const segs = [];
    if (entry) {
        const buf = Buffer.alloc(entry.count * SEGMENT_BYTES);
        fs.readSync(fd, buf, 0, buf.length, entry.offset);
        for (let i = 0; i < entry.count; i += 1) {
            const at = i * SEGMENT_BYTES;
            segs.push(
                buf.readInt32BE(at) / 1e6,
                buf.readInt32BE(at + 4) / 1e6,
                buf.readInt32BE(at + 8) / 1e6,
                buf.readInt32BE(at + 12) / 1e6
            );
        }
    }
    cache.set(key, segs);
    while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
    return segs;
};

/*
 * Segments are bucketed by their first endpoint, so one crossing a cell
 * boundary sits in only one of the two cells it touches. The range is widened
 * by a cell on every side to pick those up.
 */
const segmentsNear = (lat, lon) => {
    const padLat = REACH_M / 111320;
    const padLon = padLat / Math.max(0.15, Math.cos((lat * Math.PI) / 180));
    const y0 = Math.floor((lat - padLat) / cellDeg) - 1;
    const y1 = Math.floor((lat + padLat) / cellDeg) + 1;
    const x0 = Math.floor((lon - padLon) / cellDeg) - 1;
    const x1 = Math.floor((lon + padLon) / cellDeg) + 1;
    const flat = [];
    for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
            const cell = readCell(`${y},${x}`);
            for (let i = 0; i < cell.length; i += 1) flat.push(cell[i]);
        }
    }
    return flat;
};

const project = (lat0, lon0) => {
    const mLon = 111320 * Math.cos((lat0 * Math.PI) / 180);
    return (lat, lon) => [(lon - lon0) * mLon, (lat - lat0) * 111320];
};

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

const openBearings = (near, ox, oy) => {
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
    return blocked.filter((b) => !b).length;
};

/*
 * known:false means the extract has no shoreline within reach of this point.
 * That covers a coast the boxes in build_coastline.js do not include and a
 * point far inland alike, and the two are not worth telling apart: neither can
 * be shown to touch the ocean, and the caller refuses both. A coast outside the
 * boxes stays unusable until a box is added and the file regenerated.
 */
const classify = (lat, lon) => {
    open();
    const flat = segmentsNear(lat, lon);
    if (!flat.length) return { coastal: false, known: false, shoreline_m: null, open: 0 };

    const to = project(lat, lon);
    const near = [];
    const candidates = [];
    for (let i = 0; i < flat.length; i += 4) {
        const [ax, ay] = to(flat[i], flat[i + 1]);
        const [bx, by] = to(flat[i + 2], flat[i + 3]);
        if (Math.min(ax, bx) > REACH_M || Math.max(ax, bx) < -REACH_M) continue;
        if (Math.min(ay, by) > REACH_M || Math.max(ay, by) < -REACH_M) continue;
        near.push([ax, ay, bx, by]);
        const n = nearestOnSegment(ax, ay, bx, by);
        if (n.d2 <= COAST_MAX_M * COAST_MAX_M) candidates.push(n);
    }
    if (!near.length) return { coastal: false, known: false, shoreline_m: null, open: 0 };
    if (!candidates.length) {
        return { coastal: false, known: true, shoreline_m: null, open: 0 };
    }

    candidates.sort((a, b) => a.d2 - b.d2);
    let bestOpen = 0;
    let bestM = Math.sqrt(candidates[0].d2);
    for (const c of candidates.slice(0, CANDIDATES)) {
        const len = Math.hypot(c.dx, c.dy) || 1;
        // Seaward is the right-hand normal: GSHHG winds land counter-clockwise.
        const count = openBearings(
            near,
            c.px + (c.dy / len) * OFFSHORE_M,
            c.py + (-c.dx / len) * OFFSHORE_M
        );
        if (count > bestOpen) {
            bestOpen = count;
            bestM = Math.sqrt(c.d2);
        }
    }

    return {
        coastal: bestOpen >= OPEN_BINS_MIN,
        known: true,
        shoreline_m: Number(bestM.toFixed(1)),
        open: bestOpen,
    };
};

module.exports = { classify, COAST_MAX_M, OPEN_BINS_MIN, GRID_DEG };
