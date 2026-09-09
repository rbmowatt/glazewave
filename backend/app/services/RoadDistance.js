/*
 * Re-ranks spot candidates by driving distance.
 *
 * Straight-line distance misorders a surf log wherever water sits between two
 * points. Measured against OSRM over the seeded table, crow-flight ordering
 * differs from road ordering in the top 5 at 9 of 10 sampled coastal origins;
 * from Ship Bottom on Long Beach Island the nearest crow spot is 22.5km away
 * and 64.8km by road, because the only way off the island is north to the
 * causeway.
 *
 * Grouping by GSHHG shoreline polygon does not fix this and was measured
 * before this was written: the New Jersey mainland, the Barnegat Peninsula and
 * every Baja spot all snap to one level-1 polygon (id 2, North America), so
 * the grouping is a no-op at 8 of those 10 origins and reorders wrongly at the
 * other 2. Along-shore arc length is worse still - two points on opposite
 * sides of a barrier island are 46km apart along the waterline and 7km apart
 * by road.
 *
 * Dependency-free on purpose: global fetch, no axios, so this file behaves the
 * same on the box and in a bare checkout.
 */
'use strict';

/*
 * The FOSSGIS demo server. It answers /table without a key, but it throttles
 * by delaying rather than refusing: the first request from a cold client comes
 * back in ~560ms and every one after that sits at a hard 7.5s floor, measured
 * over 11 paced requests, all HTTP 200. That is why nothing here blocks a
 * response on a cache miss.
 */
const HOST = process.env.OSRM_HOST || 'https://routing.openstreetmap.de/routed-car';
const ENABLED = process.env.OSRM_ENABLED !== 'false';

// How long a request is willing to wait for a ranking already being fetched.
// Long enough to catch an unthrottled reply, far short of the 7.5s floor.
const INLINE_WAIT_MS = Number.parseInt(process.env.OSRM_INLINE_WAIT_MS, 10) || 1200;

// How long the background fetch itself may run, well past the 7.5s floor so a
// throttled reply still lands in the cache for the next caller.
const FETCH_TIMEOUT_MS = Number.parseInt(process.env.OSRM_TIMEOUT_MS, 10) || 20000;

// Wider than the requested limit so the router has something to reorder. A
// spot outside this pool cannot be promoted, so the pool bounds how far the
// ranking can differ from crow-flight - 25 candidates covers the whole seeded
// table inside a 50km radius anywhere on the Jersey coast.
const POOL_MULTIPLIER = 3;
const POOL_MIN = 12;
const POOL_MAX = 25;

// The coastline does not move, so a long TTL costs nothing and is the only
// thing that makes a 7.5s upstream usable at all. Keyed on the origin rounded
// to ~110m, which is finer than any two spots the ranking can distinguish.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;

const cache = new Map();
// One fetch per key at a time. Without this a cold spot on a shared origin
// fans out one upstream request per visitor, which is what gets a client
// throttled harder.
const inFlight = new Map();

const poolSize = (limit) =>
  Math.min(POOL_MAX, Math.max(POOL_MIN, limit * POOL_MULTIPLIER));

const cacheKey = (lat, lon, ids) =>
  `${lat.toFixed(3)},${lon.toFixed(3)}|${ids.join(',')}`;

const cacheGet = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return null;
  }
  // Re-insert so the eviction below drops the least recently used.
  cache.delete(key);
  cache.set(key, hit);
  return hit.distances;
};

const cachePut = (key, distances) => {
  cache.set(key, { distances, expires: Date.now() + CACHE_TTL_MS });
  while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
};

/*
 * OSRM's table service with sources=0 is one request for the whole fan-out:
 * origin to every candidate, distances in meters. Coordinates go lon,lat -
 * the same axis order as MySQL's POINT(), and the opposite of every lat/lon
 * pair elsewhere in this codebase.
 */
const fetchTable = async (lat, lon, spots) => {
  const coords = [`${lon},${lat}`]
    .concat(spots.map((s) => `${Number(s.lon)},${Number(s.lat)}`))
    .join(';');
  const url = `${HOST}/table/v1/driving/${coords}?sources=0&annotations=distance`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'glazewave (+https://github.com/rbmowatt/glazewave)' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);

  const body = await res.json();
  if (body.code !== 'Ok' || !Array.isArray(body.distances)) {
    throw new Error(`OSRM code ${body.code}`);
  }

  const distances = body.distances[0].slice(1);
  if (distances.length !== spots.length) throw new Error('OSRM row length mismatch');
  // A null is an unroutable candidate, an island with no ferry in OSM. One is
  // enough to discard the whole table - see the all-or-nothing note on rank().
  if (distances.some((d) => d === null || !Number.isFinite(d))) {
    throw new Error('OSRM returned an unroutable candidate');
  }
  return distances;
};

const warm = (key, lat, lon, spots) => {
  if (inFlight.has(key)) return inFlight.get(key);
  const job = fetchTable(lat, lon, spots)
    .then((distances) => {
      cachePut(key, distances);
      return distances;
    })
    .catch((err) => {
      console.error('spot road ranking unavailable:', err.message);
      return null;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, job);
  return job;
};

/*
 * Returns the spots reordered by driving distance with distance_m replaced, or
 * null when the ranking is not available yet.
 *
 * All or nothing on purpose. A partial answer would mix road and straight-line
 * metres in one response and the caller has no way to tell which row is which,
 * so anything short of a full table discards the re-rank and the caller keeps
 * its crow-flight order.
 *
 * A cold origin therefore answers crow-flight and warms the cache behind the
 * response. Every later request for that origin gets the road ordering. This
 * is a consequence of the 7.5s throttle above, not a preference: the durable
 * fix is a precomputed spot-to-spot road matrix, which turns this into a join.
 */
const rank = async (lat, lon, spots) => {
  if (!ENABLED || spots.length < 2) return null;

  const key = cacheKey(lat, lon, spots.map((s) => s.id));
  let distances = cacheGet(key);

  if (!distances) {
    const job = warm(key, lat, lon, spots);
    // Take the answer if it beats the grace period, otherwise leave the fetch
    // running and answer now. Resolving the race to null rather than rejecting
    // keeps an unhandled rejection off the background job.
    distances = await Promise.race([
      job,
      new Promise((resolve) => setTimeout(() => resolve(null), INLINE_WAIT_MS)),
    ]);
  }
  if (!distances) return null;

  return spots
    .map((spot, i) => ({ ...spot, distance_m: distances[i] }))
    .sort((a, b) => a.distance_m - b.distance_m);
};

module.exports = { rank, poolSize };
