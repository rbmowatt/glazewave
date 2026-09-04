/*
 * Diagnostic only. Writes nothing to the database or the Elasticsearch indexes.
 *
 * Deliberately dependency-free: it uses global fetch so it runs from a bare
 * checkout with no node_modules, on the Mac and on the box alike.
 *
 * Run it on a residential connection AND on the EC2 box. Surfline answered 403
 * to a datacenter address while this was being investigated, and whether that
 * reproduces on the box decides if the spot import can ever run there.
 */
const TIMEOUT_MS = 20000;

// Node's fetch sends a bare User-Agent and no Accept. OSM's usage policy asks
// callers to identify themselves, and some hosts reject the default outright.
// This identifies the client honestly rather than imitating a browser.
const HEADERS = {
  'User-Agent': 'glazewave-spot-probe (+https://github.com/rbmowatt/glazewave)',
  'Accept': 'application/json',
};

// A non-200 is a result worth printing, not an exception. The old importer
// caught 403s into an empty block, which is why the spot table quietly stopped
// filling without anything surfacing.
const get = async (url, options = {}, timeoutMs = TIMEOUT_MS) => {
  const res = await fetch(url, Object.assign(
    { signal: AbortSignal.timeout(timeoutMs) },
    options,
    { headers: Object.assign({}, HEADERS, options.headers || {}) }
  ));
  let body = null;
  try { body = await res.json(); } catch (e) { body = null; }
  return { status: res.status, body: body };
};

const line = (label, status, detail) =>
  console.log(`${label.padEnd(26)} ${String(status).padEnd(9)} ${detail}`);

const fail = (label, err) =>
  line(label, 'ERROR', err.name === 'TimeoutError' ? 'timed out' : (err.cause && err.cause.code) || err.message);

/*
 * The exact call the importer makes. A 200 is not enough on its own: the
 * importer walks data[].hits.hits[]._source and reads breadCrumbs,
 * location.lat/lon and href, so a schema change breaks it as completely as a
 * block does.
 */
const probeSurflineSearch = async () => {
  const label = 'surfline search';
  try {
    const { status, body } = await get('https://services.surfline.com/kbyg/search/site?q=A&querySize=5');
    if (status !== 200) return line(label, status, 'blocked or unavailable');

    const groups = Array.isArray(body) ? body : [];
    const hits = groups
      .filter((g) => g && g.hits && Array.isArray(g.hits.hits))
      .reduce((all, g) => all.concat(g.hits.hits), []);
    const usable = hits.filter((h) => {
      const s = h && h._source;
      return s && s.name && s.href && s.breadCrumbs && s.location &&
        typeof s.location.lat !== 'undefined' && typeof s.location.lon !== 'undefined';
    });

    line(label, status, `${hits.length} hits, ${usable.length} with the fields the importer needs`);
  } catch (err) {
    fail(label, err);
  }
};

/*
 * Control. If search is blocked but this answers, only that one endpoint is
 * gated rather than the whole API. Spot id is Venice Breakwater, taken from a
 * public surfline.com URL.
 */
const probeSurflineSpot = async () => {
  const label = 'surfline spot detail';
  try {
    const { status } = await get('https://services.surfline.com/kbyg/spots/forecasts?spotId=590927576a2e4300134fbed8&days=1');
    line(label, status, status === 200 ? 'answers unauthenticated' : 'blocked or unavailable');
  } catch (err) {
    fail(label, err);
  }
};

/*
 * OpenStreetMap fallback. Coverage is the open question, not availability: a
 * spot with no name tag renders as a blank row, so the named count matters
 * more than the total. Bounding box is the New Jersey coast.
 */
/*
 * OpenStreetMap fallback. sport=surfing sits on nodes, ways and areas, so nwr
 * is required -- a node-only query reports zero even where spots are mapped.
 * The global counts are the number that decides this: coverage, not
 * availability, is the open question, and an unnamed spot renders as a blank
 * row so the named total is the honest ceiling.
 */
const OVERPASS = 'https://overpass-api.de/api/interpreter';

const overpassCount = async (label, query, timeoutMs) => {
  try {
    const { status, body } = await get(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data: query }).toString(),
    }, timeoutMs);
    if (status !== 200) return line(label, status, 'blocked or unavailable');
    const tags = (((body || {}).elements || [])[0] || {}).tags || {};
    line(label, status, `${tags.total || 0} total (${tags.nodes || 0} nodes, ${tags.ways || 0} ways, ${tags.relations || 0} relations)`);
  } catch (err) {
    fail(label, err);
  }
};

const probeOverpass = async () => {
  await overpassCount('osm surfing, NJ coast',
    '[out:json][timeout:60];nwr["sport"="surfing"](38.5,-75.5,41.5,-73.5);out count;', 70000);
  await overpassCount('osm surfing, SoCal',
    '[out:json][timeout:60];nwr["sport"="surfing"](32.5,-118.5,34.5,-117.0);out count;', 70000);
  await overpassCount('osm surfing, global',
    '[out:json][timeout:180];nwr["sport"="surfing"];out count;', 200000);
  await overpassCount('osm surfing, global named',
    '[out:json][timeout:180];nwr["sport"="surfing"]["name"];out count;', 200000);
};

const run = async () => {
  console.log(`probing spot sources, ${new Date().toISOString()}`);
  console.log(`${'source'.padEnd(26)} ${'status'.padEnd(9)} detail`);
  await probeSurflineSearch();
  await probeSurflineSpot();
  await probeOverpass();
};

run();
