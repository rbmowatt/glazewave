/*
 * Builds data/spot_images.json and data/spot-images/: a freely licensed photo
 * set for every spot in data/surfline_spots.json, with the licence metadata
 * needed to publish it.
 *
 * Why this exists: surfline_spots.json is 1,611 OSM beach features and nothing
 * else - no photo, no description, no substrate. Every commercial surf-photo
 * source is rights-reserved, so the only publishable imagery is Wikimedia
 * Commons plus the stock platforms that grant a blanket licence.
 *
 * Four tiers, most trustworthy first. A spot stops at the first tier that
 * yields KEEP_PER_SPOT images above SCORE_MIN:
 *
 *   1. osm-image     the feature's own `image` tag, when it points at Commons.
 *   2. commons-geo   Commons geosearch around the spot's coordinates.
 *   3. commons-text  Commons full-text search on the spot and region name.
 *   4. stock         Pexels / Pixabay / Unsplash, region-level only, and only
 *                    when the matching API key is in the environment.
 *
 * Geosearch alone is not usable. It returns everything geotagged nearby, which
 * on a first pass gave a stick insect for Bannings Beach and a Land Rover for
 * Fort Beach. Every candidate is scored on name tokens, coastal vocabulary,
 * distance and pixel width, and anything scoring below SCORE_MIN is dropped
 * rather than ranked - a wrong photo on a spot card is worse than no photo.
 *
 * Licence facts come from Commons `extmetadata`, not from guesswork, and a
 * candidate whose LicenseShortName is missing or non-free is rejected outright.
 * `attribution_line` is precomposed per image so the frontend never has to
 * assemble one. CC BY-SA is flagged share_alike: it is fine to display, and a
 * trap the moment you composite it into a generated image.
 *
 * OSM tags are fetched separately because the seed file kept only id, name and
 * coordinates. They carry `surface`, which is the only free source of
 * sandy/rocky/reef anywhere - roughly 43% of features have it - plus
 * supervised, access, website and the occasional wikipedia link. Overpass 504s
 * on 250 ids and answers on 120, so batches are 120.
 *
 * There is no free source of reviews. OSM has no review field and the platforms
 * that do (Google, Yelp, TripAdvisor) licence neither the text nor the ratings.
 * Nothing in this file invents one.
 *
 * Dependency-free, so it runs from a bare checkout on Node 18+. Every API
 * response is cached under ~/.cache/glazewave/spot-images (GLAZEWAVE_CACHE
 * overrides) before the next request is made, so a killed run resumes where it
 * stopped. Delete the cache to force a refetch.
 *
 * Usage:
 *   node harvest_spot_images.js --stage=tags        OSM tags for every feature
 *   node harvest_spot_images.js --stage=meta        find + score candidates
 *   node harvest_spot_images.js --stage=download    fetch the image bytes
 *   node harvest_spot_images.js --stage=docs        manifest + attribution docs
 *   node harvest_spot_images.js --stage=all
 *
 *   --budget=120        stop cleanly after 120s and exit 3, for capped shells
 *   --regions=US-CA,MX-BCS
 *   --limit=50          first N spots only
 *   --width=1600        max thumbnail width to download
 *
 * Exit 3 means "budget hit, work is cached, run me again". Anything else is a
 * real failure.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const UA =
  'glazewave-spot-image-harvest/1.0 (https://glazewave.com; richmowatt@gmail.com)';

const DATA_DIR = path.resolve(__dirname, '../../data');
const SEED_FILE = path.join(DATA_DIR, 'surfline_spots.json');
const IMAGE_DIR = path.join(DATA_DIR, 'spot-images');
const MANIFEST_FILE = path.join(DATA_DIR, 'spot_images.json');
const DOCS_DIR = path.resolve(__dirname, '../../../docs');

const CACHE_DIR = path.join(
  process.env.GLAZEWAVE_CACHE || path.join(os.homedir(), '.cache/glazewave'),
  'spot-images'
);

const KEEP_PER_SPOT = 3;
const SCORE_MIN = 5;
const GEO_RADII = [1500, 5000];
const GEO_LIMIT = 40;
const TEXT_LIMIT = 25;
const OVERPASS_BATCH = 120;
const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

/* Commons throttles hard on parallel anonymous calls; two in flight is the
 * most that ran a full pass without 429s. */
const CONCURRENCY = 2;

const started = Date.now();
const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};
const STAGE = opt('stage', 'all');
const BUDGET_MS = Number(opt('budget', 0)) * 1000;
const LIMIT = Number(opt('limit', 0));
const MAX_WIDTH = Number(opt('width', 1600));
const REGION_FILTER = (opt('regions', '') || '')
  .split(',')
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);

const outOfBudget = () => BUDGET_MS > 0 && Date.now() - started > BUDGET_MS;

/* ------------------------------------------------------------------ */
/* region codes                                                        */
/* ------------------------------------------------------------------ */

const US_STATES = {
  Alabama: 'AL', Alaska: 'AK', California: 'CA', Connecticut: 'CT',
  Delaware: 'DE', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI',
  Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New York': 'NY',
  'North Carolina': 'NC', Oregon: 'OR', 'Rhode Island': 'RI',
  'South Carolina': 'SC', Texas: 'TX', Virginia: 'VA', Washington: 'WA',
};

const MX_STATES = {
  'Baja California': 'BC', 'Baja California Sur': 'BCS', Campeche: 'CAM',
  Colima: 'COL', Guerrero: 'GRO', Jalisco: 'JAL', Michoacan: 'MIC',
  Nayarit: 'NAY', Oaxaca: 'OAX', 'Quintana Roo': 'ROO', Sinaloa: 'SIN',
  Sonora: 'SON', Tabasco: 'TAB', Tamaulipas: 'TAM', Veracruz: 'VER',
  Yucatan: 'YUC',
};

function regionCode(crumbs) {
  const [country, state] = String(crumbs || '').split(',').map((s) => s.trim());
  if (country === 'United States') return `US-${US_STATES[state] || 'XX'}`;
  if (country === 'Mexico') return `MX-${MX_STATES[state] || 'XX'}`;
  return 'XX-XX';
}

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slug(s) {
  return String(s)
    .normalize('NFD')
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'unnamed';
}

function stripHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstHref(html) {
  const m = /href="([^"]+)"/i.exec(String(html || ''));
  return m ? m[1] : null;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

fs.mkdirSync(CACHE_DIR, { recursive: true });

function cacheGet(key) {
  const f = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(f)) return null;
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {
    return null;
  }
}

function cacheSet(key, value) {
  fs.writeFileSync(
    path.join(CACHE_DIR, `${key}.json`),
    JSON.stringify(value),
    'utf8'
  );
}

async function getJSON(url, tries = 4) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429 || res.status >= 500) {
        await sleep(1200 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return await res.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(900 * (i + 1));
    }
  }
  return null;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(
    async () => {
      for (;;) {
        const i = cursor;
        cursor += 1;
        if (i >= items.length) return;
        out[i] = await fn(items[i], i);
      }
    }
  );
  await Promise.all(workers);
  return out;
}

/* ------------------------------------------------------------------ */
/* licence interpretation                                              */
/* ------------------------------------------------------------------ */

const LICENSE_URLS = {
  'cc0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'cc by 1.0': 'https://creativecommons.org/licenses/by/1.0/',
  'cc by 2.0': 'https://creativecommons.org/licenses/by/2.0/',
  'cc by 2.5': 'https://creativecommons.org/licenses/by/2.5/',
  'cc by 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'cc by 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'cc by-sa 1.0': 'https://creativecommons.org/licenses/by-sa/1.0/',
  'cc by-sa 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'cc by-sa 2.5': 'https://creativecommons.org/licenses/by-sa/2.5/',
  'cc by-sa 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'cc by-sa 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'public domain': 'https://en.wikipedia.org/wiki/Public_domain',
  'pdm-owner': 'https://creativecommons.org/publicdomain/mark/1.0/',
};

/* A licence Commons cannot name is a licence we cannot publish under. These
 * are the strings that have appeared on non-free Commons and Wikipedia files;
 * anything matching is dropped before it reaches the score. */
const NON_FREE = /fair use|non-?free|no known copyright|all rights reserved|copyrighted free use provided|nc\b|nd\b|noncommercial|no derivative/i;

function classifyLicense(shortNameRaw, usageTerms) {
  const shortName = stripHtml(shortNameRaw);
  if (!shortName) return null;
  const key = shortName.toLowerCase().trim();
  if (NON_FREE.test(key)) return null;

  const isCc = key.startsWith('cc');
  const isPd = /public domain|^pd|cc0/.test(key);
  if (!isCc && !isPd) return null;

  return {
    license: shortName,
    license_url: LICENSE_URLS[key] || null,
    usage_terms: stripHtml(usageTerms) || null,
    attribution_required: !(key === 'cc0' || /public domain|^pd/.test(key)),
    share_alike: /-sa/.test(key),
    commercial_use: true,
    copyleft_note: /-sa/.test(key)
      ? 'ShareAlike: safe to display as-is, but any derivative or composite you publish must carry the same licence.'
      : null,
  };
}

/* Commons `Artist` is free HTML and some uploaders put a paragraph in it -
 * Mr. Matté's runs "Mr. Matté (if there is an issue with this image, contact me
 * using this image's Commons talk page...)". The licence wants the name, so
 * drop long parentheticals and cap what is left. */
function cleanAuthor(raw) {
  if (!raw) return null;
  let a = String(raw).replace(/\s*\([^)]{40,}\)?/g, '').replace(/\s+/g, ' ').trim();
  a = a.replace(/[,;:.\s]+$/, '');
  if (a.length > 110) {
    a = `${a.slice(0, 110).replace(/\s+\S*$/, '')}…`;
  }
  return a || null;
}

function attributionLine(img) {
  if (!img.attribution_required) {
    return `${img.title_plain} — ${img.license} (${img.source_label}), no attribution required`;
  }
  const who = img.author || 'Unknown author';
  return `“${img.title_plain}” by ${who}, ${img.source_label}, ${img.license}`;
}

/* ------------------------------------------------------------------ */
/* relevance scoring                                                   */
/* ------------------------------------------------------------------ */

const COASTAL = [
  'beach', 'surf', 'surfer', 'surfing', 'wave', 'waves', 'ocean', 'sea',
  'coast', 'coastal', 'coastline', 'shore', 'shoreline', 'sand', 'dune',
  'playa', 'mar', 'pier', 'jetty', 'bay', 'cove', 'point', 'break',
  'swell', 'boardwalk', 'lighthouse', 'cliff', 'headland', 'tide',
  'inlet', 'lagoon', 'seascape', 'sunset', 'sunrise', 'bodysurf',
  'longboard', 'shortboard', 'barrel', 'reef', 'rocks', 'seashore',
];

/* At least one of these has to appear in the title or the categories. Without
 * the hard requirement, geosearch hands back whatever else is geotagged within
 * a kilometre - a stick insect for Bannings Beach, a Land Rover for Fort Beach
 * - and a distance bonus is not enough to push those below any sane threshold. */
const CORE_COASTAL = [
  'beach', 'surf', 'ocean', 'sea', 'coast', 'shore', 'sand', 'dune',
  'wave', 'playa', 'pier', 'boardwalk', 'bay', 'cove', 'reef', 'seascape',
  'tide', 'lagoon', 'inlet', 'cliff', 'lighthouse', 'jetty', 'swell',
  'headland', 'estuary', 'strand', 'mar ', 'marea',
];

/* Commons geosearch is dense with local wildlife and street furniture. These
 * are the categories that actually surfaced on a first pass, plus the shapes
 * that never make a spot card. */
const REJECT = [
  'map', 'maps', 'diagram', 'chart', 'logo', 'coat of arms', 'seal of',
  'flag of', 'plaque', 'gravestone', 'cemetery', 'church', 'chapel',
  'signature', 'postage stamp', 'insect', 'beetle', 'spider', 'moth',
  'butterfly', 'lizard', 'snake', 'fungus', 'mushroom', 'herbarium',
  'aircraft', 'locomotive', 'railway', 'automobile', 'car ', 'truck',
  'interior of', 'portrait of', 'headshot', 'scanned', 'poster',
  'screenshot', 'graffiti', 'shopping', 'restaurant interior',
  'casino', 'hotel', 'motel', 'signage', 'road sign', 'street sign',
  'intersection', 'parking lot', 'roads in', 'streets in', 'buildings in',
  'houses in', 'bridges in', 'schools in', 'stores in', 'churches in',
];

/* Famartin and others have uploaded tens of thousands of geotagged roadway
 * photos titled "<Street> nb, <Town>, NJ" - nb/sb/eb/wb is the direction of
 * travel. They are geotagged on the beach block and score well on distance. */
const ROADWAY = /\b(nb|sb|eb|wb)\b\s*,|\b(route|highway|interstate)\s+\d/i;

/* Binomial nomenclature: "Anolis nebulosus 223855.jpg" is a species photo
 * that happens to be geotagged on a beach. Two capitalised-then-lowercase
 * Latin words at the head of a filename is the reliable tell. */
const BINOMIAL = /^[A-Z][a-z]{3,}\s+[a-z]{4,}(\s|$|\d)/;

const STOPWORDS = new Set([
  'beach', 'playa', 'the', 'de', 'la', 'el', 'los', 'las', 'del', 'street',
  'st', 'ave', 'avenue', 'park', 'state', 'county', 'north', 'south',
  'east', 'west', 'point', 'bay',
]);

function nameTokens(name) {
  return slug(name)
    .split('-')
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function scoreCandidate(spot, cand) {
  const hay = `${cand.title_plain} ${(cand.categories || []).join(' ')} ${
    cand.description || ''
  }`.toLowerCase();

  const signals = [];
  let score = 0;

  if (BINOMIAL.test(cand.title_plain)) return { score: -99, signals: ['binomial'] };
  if (ROADWAY.test(cand.title_plain)) return { score: -99, signals: ['roadway'] };
  for (const bad of REJECT) {
    if (hay.includes(bad)) return { score: -99, signals: [`reject:${bad.trim()}`] };
  }

  const core = CORE_COASTAL.filter((k) => hay.includes(k));
  if (!core.length) return { score: -99, signals: ['no-coastal-subject'] };

  const titleLower = cand.title_plain.toLowerCase();
  if (CORE_COASTAL.some((k) => titleLower.includes(k))) {
    score += 2;
    signals.push('coastal-in-title');
  }

  const tokens = nameTokens(spot.name);
  const matched = tokens.filter((t) => hay.includes(t));
  if (matched.length) {
    score += 4 * matched.length;
    signals.push(`name:${matched.join('+')}`);
  }

  const kw = COASTAL.filter((k) => hay.includes(k));
  if (kw.length) {
    score += Math.min(4, kw.length * 1.5);
    signals.push(`kw:${kw.slice(0, 4).join('+')}`);
  }
  /* No coastal vocabulary anywhere means it is a photo taken near the beach,
   * not a photo of it. */
  if (!kw.length) score -= 3;

  if (typeof cand.distance_m === 'number') {
    if (cand.distance_m <= 400) { score += 3; }
    else if (cand.distance_m <= 1200) { score += 2; }
    else if (cand.distance_m <= 3000) { score += 1; }
    signals.push(`geo:${cand.distance_m}m`);
  }

  if (cand.width >= 2000) { score += 1.5; signals.push('w>=2000'); }
  else if (cand.width >= 1000) { score += 0.5; signals.push('w>=1000'); }
  else if (cand.width && cand.width < 640) { score -= 2; signals.push('small'); }

  if (cand.width && cand.height && cand.width / cand.height >= 1.3) {
    score += 0.5;
    signals.push('landscape');
  }

  if (cand.tier === 'osm-image') { score += 6; signals.push('osm-image-tag'); }

  return { score: Math.round(score * 10) / 10, signals };
}

/* ------------------------------------------------------------------ */
/* Commons                                                             */
/* ------------------------------------------------------------------ */

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const IIPROPS =
  'url|size|mime|extmetadata|dimensions|user|canonicaltitle';

async function commonsImageInfo(titles) {
  if (!titles.length) return {};
  const out = {};
  for (let i = 0; i < titles.length; i += 25) {
    const chunk = titles.slice(i, i + 25);
    const url =
      `${COMMONS_API}?action=query&format=json&formatversion=2` +
      `&prop=${encodeURIComponent('imageinfo|categories|coordinates')}` +
      `&iiprop=${encodeURIComponent(IIPROPS)}&iiurlwidth=${MAX_WIDTH}` +
      `&cllimit=500&clshow=${encodeURIComponent('!hidden')}` +
      `&titles=${encodeURIComponent(chunk.join('|'))}`;
    const data = await getJSON(url);
    for (const p of (data && data.query && data.query.pages) || []) {
      if (!p.imageinfo || !p.imageinfo[0]) continue;
      out[p.title] = {
        page: p,
        info: p.imageinfo[0],
        categories: (p.categories || []).map((c) =>
          c.title.replace(/^Category:/, '')
        ),
        coordinates: (p.coordinates || [])[0] || null,
      };
    }
  }
  return out;
}

function toCandidate(spot, title, rec, tier, distanceOverride) {
  const info = rec.info;
  const meta = info.extmetadata || {};
  const val = (k) => (meta[k] && meta[k].value) || '';

  if (!/^image\/(jpeg|png|webp)$/.test(info.mime || '')) return null;

  const lic = classifyLicense(val('LicenseShortName'), val('UsageTerms'));
  if (!lic) return null;

  const coords = rec.coordinates;
  let distance_m = distanceOverride;
  if (distance_m == null && coords) {
    distance_m = haversine(
      Number(spot.lat), Number(spot.lon), coords.lat, coords.lon
    );
  }

  const titlePlain = title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '');

  const cand = {
    tier,
    source: 'wikimedia-commons',
    source_label: 'Wikimedia Commons',
    title,
    title_plain: titlePlain,
    description: stripHtml(val('ImageDescription')).slice(0, 600) || null,
    source_page_url: info.descriptionurl || null,
    original_file_url: info.url || null,
    download_url: info.thumburl || info.url || null,
    width: info.thumbwidth || info.width || null,
    height: info.thumbheight || info.height || null,
    original_width: info.width || null,
    original_height: info.height || null,
    mime: info.mime,
    author: cleanAuthor(stripHtml(val('Artist'))) || (info.user ? `${info.user} (Commons user)` : null),
    author_url: firstHref(val('Artist')),
    credit: stripHtml(val('Credit')).slice(0, 300) || null,
    date_original: stripHtml(val('DateTimeOriginal')).slice(0, 40) || null,
    categories: rec.categories,
    geotagged: Boolean(coords),
    image_lat: coords ? coords.lat : null,
    image_lon: coords ? coords.lon : null,
    distance_m: distance_m == null ? null : distance_m,
    retrieved_at: new Date().toISOString(),
    ...lic,
  };

  const { score, signals } = scoreCandidate(spot, cand);
  cand.relevance_score = score;
  cand.matched_signals = signals;
  cand.attribution_line = attributionLine(cand);
  return cand;
}

async function commonsGeo(spot) {
  const found = new Map();
  for (const radius of GEO_RADII) {
    const url =
      `${COMMONS_API}?action=query&format=json&formatversion=2&list=geosearch` +
      `&gsradius=${radius}&gscoord=${encodeURIComponent(`${spot.lat}|${spot.lon}`)}` +
      `&gsnamespace=6&gslimit=${GEO_LIMIT}`;
    const data = await getJSON(url);
    for (const r of (data && data.query && data.query.geosearch) || []) {
      if (!found.has(r.title)) found.set(r.title, Math.round(r.dist));
    }
    if (found.size >= GEO_LIMIT) break;
  }
  return found;
}

async function commonsText(spot) {
  const region = String(spot.crumbs || '').split(',').pop().trim();
  const queries = [
    `${spot.name} ${region} beach`,
    `${spot.name} surf`,
  ];
  const found = new Map();
  for (const q of queries) {
    const url =
      `${COMMONS_API}?action=query&format=json&formatversion=2&list=search` +
      `&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=${TEXT_LIMIT}`;
    const data = await getJSON(url);
    for (const r of (data && data.query && data.query.search) || []) {
      if (!found.has(r.title)) found.set(r.title, null);
    }
    if (found.size >= TEXT_LIMIT) break;
  }
  return found;
}

/* ------------------------------------------------------------------ */
/* stage: OSM tags                                                     */
/* ------------------------------------------------------------------ */

/* Observed values across the 1,611 features, in frequency order: sand (540),
 * gravel (22), fine_sand, pebblestone, unpaved, rocky, rock, paving_stones,
 * clay, reef, "grass,_sand". 930 have no surface tag at all - that is the
 * honest answer for those, not an inferred "sandy". */
const SURFACE_TO_TYPE = {
  sand: 'sandy', fine_sand: 'sandy', fine_gravel: 'sandy', dirt: 'sandy',
  earth: 'sandy', gravel: 'gravel', pebbles: 'rocky', pebblestone: 'rocky',
  rock: 'rocky', rocky: 'rocky', rocks: 'rocky', stone: 'rocky',
  boulders: 'rocky', shingle: 'rocky', reef: 'reef', coral: 'reef',
  shell: 'shell', mud: 'mud', clay: 'mud', grass: 'grass',
  concrete: 'man-made', asphalt: 'man-made', paving_stones: 'man-made',
  unpaved: null,
};

function beachType(surface) {
  if (!surface) return null;
  const parts = String(surface).split(/[;,]/).map((s) => s.trim().replace(/^_|_$/g, ''));
  const mapped = [...new Set(parts.map((p) => SURFACE_TO_TYPE[p] || null).filter(Boolean))];
  if (!mapped.length) return null;
  return mapped.length === 1 ? mapped[0] : `mixed (${mapped.join('/')})`;
}

async function stageTags(spots) {
  const cached = cacheGet('osm_tags') || {};
  const byType = { node: [], way: [], relation: [] };
  for (const s of spots) {
    if (cached[s.id]) continue;
    const [, kind, id] = /^osm:(node|way|relation)\/(\d+)$/.exec(s.id) || [];
    if (kind) byType[kind].push(id);
  }

  const todo = [];
  for (const kind of ['node', 'way', 'relation']) {
    for (let i = 0; i < byType[kind].length; i += OVERPASS_BATCH) {
      todo.push([kind, byType[kind].slice(i, i + OVERPASS_BATCH)]);
    }
  }
  if (!todo.length) {
    console.log('tags: nothing to fetch');
    return cached;
  }
  console.log(`tags: ${todo.length} Overpass batches to run`);

  for (const [kind, ids] of todo) {
    if (outOfBudget()) {
      cacheSet('osm_tags', cached);
      console.log('tags: budget hit, cached and stopping');
      process.exit(3);
    }
    const q = `[out:json][timeout:120];${kind}(id:${ids.join(',')});out tags center;`;
    let res;
    try {
      const r = await fetch(OVERPASS_ENDPOINT, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: q }),
      });
      if (!r.ok) throw new Error(`overpass HTTP ${r.status}`);
      res = await r.json();
    } catch (e) {
      console.log(`tags: ${kind} batch failed (${e.message}), skipping`);
      await sleep(4000);
      continue;
    }
    for (const el of res.elements || []) {
      cached[`osm:${el.type}/${el.id}`] = el.tags || {};
    }
    cacheSet('osm_tags', cached);
    process.stdout.write(`  ${kind} +${(res.elements || []).length}\n`);
    await sleep(1500);
  }
  cacheSet('osm_tags', cached);
  return cached;
}

function osmSummary(tags) {
  const t = tags || {};
  const surface = t.surface || null;
  return {
    tags: t,
    surface,
    beach_type: beachType(surface),
    beach_type_source: surface
      ? `OpenStreetMap surface=${surface}`
      : 'not tagged in OpenStreetMap',
    supervised: t.supervised || null,
    lifeguard: t.lifeguard || null,
    access: t.access || null,
    fee: t.fee || null,
    naturism: t.naturism || null,
    website: t.website || t['contact:website'] || null,
    wikipedia: t.wikipedia || null,
    wikidata: t.wikidata || null,
    image_tag: t.image || null,
    name_en: t['name:en'] || null,
    name_es: t['name:es'] || null,
    sport: t.sport || null,
  };
}

/* ------------------------------------------------------------------ */
/* stage: metadata                                                     */
/* ------------------------------------------------------------------ */

async function harvestSpot(spot, osm) {
  const key = `spot_${slug(spot.id)}`;
  const hit = cacheGet(key);
  if (hit) return hit;

  const titles = new Map();
  let tierOf = new Map();

  const imageTag = osm.image_tag;
  if (imageTag && /commons\.wikimedia\.org|^File:/i.test(imageTag)) {
    const m = /File:([^/?#]+)/i.exec(imageTag);
    if (m) {
      const t = `File:${decodeURIComponent(m[1])}`;
      titles.set(t, 0);
      tierOf.set(t, 'osm-image');
    }
  }

  const geo = await commonsGeo(spot);
  for (const [t, d] of geo) {
    if (!titles.has(t)) { titles.set(t, d); tierOf.set(t, 'commons-geo'); }
  }

  const text = await commonsText(spot);
  for (const [t, d] of text) {
    if (!titles.has(t)) { titles.set(t, d); tierOf.set(t, 'commons-text'); }
  }

  const info = await commonsImageInfo([...titles.keys()]);
  const cands = [];
  for (const [title, rec] of Object.entries(info)) {
    const c = toCandidate(spot, title, rec, tierOf.get(title) || 'commons-geo', titles.get(title));
    if (c && c.relevance_score >= SCORE_MIN) cands.push(c);
  }
  cands.sort((a, b) => b.relevance_score - a.relevance_score);

  const kept = cands.slice(0, KEEP_PER_SPOT);
  const result = {
    spot_id: spot.id,
    candidates_seen: titles.size,
    candidates_kept: kept.length,
    coverage: kept.length ? kept[0].tier : 'none',
    images: kept,
  };
  cacheSet(key, result);
  return result;
}

async function stageMeta(spots, tags) {
  let done = 0;
  let withImages = 0;
  const pending = spots.filter((s) => !cacheGet(`spot_${slug(s.id)}`));
  console.log(`meta: ${pending.length} of ${spots.length} spots still to harvest`);

  const batchSize = 20;
  for (let i = 0; i < pending.length; i += batchSize) {
    if (outOfBudget()) {
      console.log(`meta: budget hit after ${done} spots, cached and stopping`);
      process.exit(3);
    }
    const batch = pending.slice(i, i + batchSize);
    const results = await mapLimit(batch, CONCURRENCY, async (s) => {
      try {
        return await harvestSpot(s, osmSummary(tags[s.id]));
      } catch (e) {
        console.log(`  ! ${s.name}: ${e.message}`);
        return null;
      }
    });
    for (const r of results) {
      done += 1;
      if (r && r.images.length) withImages += 1;
    }
    process.stdout.write(
      `  ${done}/${pending.length} harvested, ${withImages} with usable images\n`
    );
  }
}

/* ------------------------------------------------------------------ */
/* stage: download                                                     */
/* ------------------------------------------------------------------ */

const DL_CONCURRENCY = 3;

function blobPath(url) {
  return path.join(
    CACHE_DIR, 'blobs',
    crypto.createHash('sha1').update(url).digest('hex')
  );
}

/* Filenames are the deliverable, so they have to be stable and unique. Region
 * plus name slug is not unique on its own: MX-BCS alone has several beaches
 * called Playa El Medano, and two spots writing the same filename would leave
 * one of them pointing at the other's photo. The OSM id suffix only appears on
 * the losers of a collision, so the common case stays readable. */
function fileNames(spots) {
  const seen = new Map();
  const names = new Map();
  for (const spot of spots) {
    const region = regionCode(spot.crumbs).toLowerCase();
    let base = `${region}-${slug(spot.name)}`;
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    if (n > 1) base = `${base}-${spot.id.replace(/\D/g, '').slice(-6)}`;
    names.set(spot.id, { region, base });
  }
  return names;
}

async function fetchBlob(url) {
  const blob = blobPath(url);
  if (fs.existsSync(blob) && fs.statSync(blob).size > 0) return 'cached';
  /* upload.wikimedia.org 429s on bursts and its error body asks you to use
   * thumbnails rather than originals. Candidates whose original is narrower
   * than --width have no thumbnail, so those hit the original URL and are the
   * ones that throttle. Back off; do not widen concurrency. */
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      fs.writeFileSync(blob, Buffer.from(await res.arrayBuffer()));
      return 'fetched';
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error('throttled after 5 attempts');
}

async function stageDownload(spots) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  fs.mkdirSync(path.join(CACHE_DIR, 'blobs'), { recursive: true });
  const names = fileNames(spots);

  /* Pass 1: pull each distinct URL once. Adjacent OSM nodes are usually the
   * same physical beach, so one Commons photo is the best match for several
   * spots - 4,039 image slots resolve to about 3,000 distinct files. */
  const urls = new Map();
  for (const spot of spots) {
    const rec = cacheGet(`spot_${slug(spot.id)}`);
    for (const img of (rec && rec.images) || []) {
      if (!urls.has(img.download_url)) urls.set(img.download_url, img.title);
    }
  }
  const todo = [...urls.keys()].filter((u) => {
    const b = blobPath(u);
    return !(fs.existsSync(b) && fs.statSync(b).size > 0);
  });
  console.log(`download: ${urls.size} distinct files, ${todo.length} still to fetch`);

  let got = 0;
  const errors = new Map();
  let budgetHit = false;
  await mapLimit(todo, DL_CONCURRENCY, async (u) => {
    if (budgetHit) return;
    if (outOfBudget()) { budgetHit = true; return; }
    try {
      await fetchBlob(u);
      got += 1;
      if (got % 100 === 0) process.stdout.write(`  ${got}/${todo.length} fetched\n`);
    } catch (e) {
      errors.set(u, e.message);
    }
    await sleep(80);
  });

  /* Pass 2: place the bytes. Local only, so it always runs to completion even
   * when pass 1 stopped on budget - a partial run still leaves a coherent tree. */
  let placed = 0;
  let missing = 0;
  for (const spot of spots) {
    const rec = cacheGet(`spot_${slug(spot.id)}`);
    if (!rec || !rec.images.length) continue;
    const { region, base } = names.get(spot.id);
    const dir = path.join(IMAGE_DIR, region);
    fs.mkdirSync(dir, { recursive: true });

    rec.images.forEach((img, i) => {
      const ext = img.mime === 'image/png' ? 'png'
        : img.mime === 'image/webp' ? 'webp' : 'jpg';
      const dest = path.join(dir, `${base}-${i + 1}.${ext}`);
      const blob = blobPath(img.download_url);
      if (!fs.existsSync(blob)) {
        img.download_error = errors.get(img.download_url) || 'not fetched yet';
        missing += 1;
        return;
      }
      const buf = fs.readFileSync(blob);
      if (!fs.existsSync(dest) || fs.statSync(dest).size !== buf.length) {
        fs.writeFileSync(dest, buf);
      }
      delete img.download_error;
      img.file = path.relative(DATA_DIR, dest);
      img.bytes = buf.length;
      img.sha256 = crypto.createHash('sha256').update(buf).digest('hex');
      placed += 1;
    });
    cacheSet(`spot_${slug(spot.id)}`, rec);
  }

  console.log(
    `download: ${got} fetched this run, ${placed} files placed, ${missing} unresolved, ` +
    `${errors.size} URLs errored`
  );
  if (budgetHit) {
    console.log('download: budget hit, blobs cached, run again to continue');
    process.exit(3);
  }
}

/* ------------------------------------------------------------------ */
/* stage: docs                                                         */
/* ------------------------------------------------------------------ */

function buildManifest(spots, tags) {
  const names = fileNames(spots);
  const out = [];
  for (const spot of spots) {
    const rec = cacheGet(`spot_${slug(spot.id)}`);
    const osm = osmSummary(tags[spot.id]);
    const region = regionCode(spot.crumbs);
    out.push({
      spot_id: spot.id,
      name: spot.name,
      slug: names.get(spot.id).base,
      region,
      region_name: spot.crumbs,
      lat: spot.lat,
      lon: spot.lon,
      osm_url: spot.url,
      osm,
      coverage: rec ? rec.coverage : 'not-harvested',
      candidates_seen: rec ? rec.candidates_seen : 0,
      /* Recompose author and credit here rather than trusting the cache, so a
       * fix to cleanAuthor lands on an existing harvest without re-querying
       * Commons for 4,000 files. */
      images: rec
        ? rec.images
          .filter((i) => i.file && !i.download_error)
          .map((i) => {
            const author = cleanAuthor(i.author);
            return { ...i, author, attribution_line: attributionLine({ ...i, author }) };
          })
        : [],
    });
  }
  return {
    generated_at: new Date().toISOString(),
    generator: 'backend/app/scripts/harvest_spot_images.js',
    spot_source: {
      name: 'OpenStreetMap',
      license: 'ODbL 1.0',
      license_url: 'https://opendatacommons.org/licenses/odbl/1-0/',
      attribution_required: true,
      attribution_line: '© OpenStreetMap contributors',
      covers: 'spot names, coordinates, surface/beach type, access and lifeguard tags',
    },
    image_sources: [
      {
        name: 'Wikimedia Commons',
        url: 'https://commons.wikimedia.org',
        licenses: 'per file — CC0, CC BY, CC BY-SA, or public domain',
        attribution_required: 'per file, see each image',
        notes:
          'Licence fields come from the Commons extmetadata API, not from inference. Any file whose LicenseShortName was missing or non-free was rejected before scoring.',
      },
    ],
    counts: {
      spots: out.length,
      spots_with_images: out.filter((s) => s.images.length).length,
      images: out.reduce((n, s) => n + s.images.length, 0),
    },
    spots: out,
  };
}

function writeDocs(manifest) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const withImg = manifest.spots.filter((s) => s.images.length);
  const byRegion = {};
  for (const s of withImg) (byRegion[s.region] = byRegion[s.region] || []).push(s);

  /* One file per region, not one 3MB file. The whole-catalogue version was
   * unreadable in an editor and useless in a diff; the credit you actually need
   * to find is always for one region's spots. */
  const attrDir = path.join(DOCS_DIR, 'spot-images');
  fs.mkdirSync(attrDir, { recursive: true });

  const licenceCounts = {};
  for (const s of withImg) {
    for (const i of s.images) licenceCounts[i.license] = (licenceCounts[i.license] || 0) + 1;
  }

  const idx = [];
  idx.push('# Glazewave spot imagery — attribution and provenance');
  idx.push('');
  idx.push(`Generated ${manifest.generated_at} by \`${manifest.generator}\`.`);
  idx.push('');
  idx.push(
    `**${manifest.counts.images} images across ${manifest.counts.spots_with_images} of ` +
    `${manifest.counts.spots} spots.** Files live under \`backend/data/spot-images/<region>/\`, ` +
    'named `<region>-<spot-slug>-<rank>.<ext>`, ranked 1 = best match. The machine-readable ' +
    'version of everything here is `backend/data/spot_images.json`; `backend/data/spot_images.csv` ' +
    'is the same thing flattened one row per image.'
  );
  idx.push('');
  idx.push('## What has to be credited');
  idx.push('');
  idx.push('Two separate obligations, and they are not the same one.');
  idx.push('');
  idx.push('**The spot data itself** — names, coordinates, beach type, lifeguard and access flags — is OpenStreetMap under ODbL 1.0. Any page showing it owes:');
  idx.push('');
  idx.push('> © OpenStreetMap contributors');
  idx.push('');
  idx.push('**Each image** carries its own credit, precomposed as `attribution_line` in the manifest. Do not roll them into one site-wide notice; the licence asks for the credit where the work appears.');
  idx.push('');
  idx.push('## The rules that actually bite');
  idx.push('');
  idx.push('- **CC BY / CC BY-SA** — the credit has to be visible where the image is, not buried on a colophon page.');
  idx.push(`- **CC BY-SA is copyleft.** ${licenceCounts && ''}Displaying one as-is is fine. Compositing it into an OG card, a share image or any generated graphic makes that output CC BY-SA too. ${
    withImg.reduce((n, s) => n + s.images.filter((i) => i.share_alike).length, 0)
  } of the ${manifest.counts.images} images are share-alike — filter on \`share_alike: false\` before you composite anything.`);
  idx.push('- **CC0 and public domain carry no obligation.** The credit lines are recorded anyway so provenance survives a later question.');
  idx.push('- **Wikimedia asks you not to hotlink** `upload.wikimedia.org` from production. These files are local copies for exactly that reason; serve them from S3.');
  idx.push('');
  idx.push('## Licence mix');
  idx.push('');
  idx.push('| Licence | Images | Attribution | Share-alike |');
  idx.push('| --- | ---: | --- | --- |');
  for (const [lic, n] of Object.entries(licenceCounts).sort((a, b) => b[1] - a[1])) {
    const meta = classifyLicense(lic, '') || {};
    idx.push(`| ${lic} | ${n} | ${meta.attribution_required ? 'required' : 'not required'} | ${meta.share_alike ? 'yes' : 'no'} |`);
  }
  idx.push('');
  idx.push('## Coverage by region');
  idx.push('');
  idx.push('| Region | Spots | With images | Images | Attribution file |');
  idx.push('| --- | ---: | ---: | ---: | --- |');
  const allRegions = [...new Set(manifest.spots.map((s) => s.region))].sort();
  for (const region of allRegions) {
    const all = manifest.spots.filter((s) => s.region === region);
    const got = all.filter((s) => s.images.length);
    const n = got.reduce((a, s) => a + s.images.length, 0);
    idx.push(
      `| ${region} — ${all[0].region_name} | ${all.length} | ${got.length} | ${n} | ` +
      `${got.length ? `[\`${region.toLowerCase()}.md\`](./${region.toLowerCase()}.md)` : '—'} |`
    );
  }
  idx.push('');
  idx.push('## Spots with no image');
  idx.push('');
  idx.push(
    `${manifest.counts.spots - manifest.counts.spots_with_images} spots found nothing above the ` +
    'relevance floor. That is the honest result, not a bug: Commons simply has no freely licensed ' +
    'photo of them. They are in the manifest with `coverage: "none"` and an empty `images` array, ' +
    'so the frontend can fall back to a regional shot rather than a broken card.'
  );
  fs.writeFileSync(path.join(attrDir, 'README.md'), `${idx.join('\n')}\n`, 'utf8');

  for (const region of Object.keys(byRegion).sort()) {
    const L = [];
    L.push(`# ${region} — ${byRegion[region][0].region_name}`);
    L.push('');
    L.push(`${byRegion[region].reduce((n, s) => n + s.images.length, 0)} images across ` +
      `${byRegion[region].length} spots. Licence rules and the OSM credit are in ` +
      '[the index](./README.md).');
    L.push('');
    for (const s of byRegion[region].sort((a, b) => a.name.localeCompare(b.name))) {
      L.push(`## ${s.name}`);
      L.push('');
      const bits = [`\`${s.spot_id}\``, `${s.lat}, ${s.lon}`];
      if (s.osm.beach_type) bits.push(`beach type: **${s.osm.beach_type}** (${s.osm.beach_type_source})`);
      if (s.osm.lifeguard || s.osm.supervised) bits.push(`lifeguard: ${s.osm.lifeguard || s.osm.supervised}`);
      if (s.osm.access) bits.push(`access: ${s.osm.access}`);
      if (s.osm.website) bits.push(`site: ${s.osm.website}`);
      L.push(bits.join(' · '));
      L.push('');
      for (const img of s.images) {
        L.push(`- **\`${path.basename(img.file)}\`** — ${img.attribution_line}`);
        L.push(`  - Source page: ${img.source_page_url}`);
        L.push(`  - Licence: ${img.license}${img.license_url ? ` (${img.license_url})` : ''}` +
          ` · attribution ${img.attribution_required ? 'required' : 'not required'}` +
          `${img.share_alike ? ' · **share-alike**' : ''}`);
        if (img.author) L.push(`  - Author: ${img.author}${img.author_url ? ` — ${img.author_url}` : ''}`);
        if (img.date_original) L.push(`  - Dated: ${img.date_original}`);
        L.push(`  - ${img.width}×${img.height}px, ${img.bytes ? `${Math.round(img.bytes / 1024)} KB` : 'size unknown'}` +
          `${img.distance_m != null ? `, shot ${img.distance_m} m from the spot` : ''}`);
        if (img.description) L.push(`  - Description: ${img.description}`);
        L.push(`  - Match: score ${img.relevance_score} via ${img.matched_signals.join(', ')}`);
      }
      L.push('');
    }
    fs.writeFileSync(path.join(attrDir, `${region.toLowerCase()}.md`), `${L.join('\n')}\n`, 'utf8');
  }

  const csv = [
    ['file', 'spot_id', 'spot_name', 'region', 'lat', 'lon', 'beach_type',
     'license', 'attribution_required', 'share_alike', 'author', 'source_page_url',
     'attribution_line', 'width', 'height', 'bytes', 'distance_m', 'relevance_score'].join(','),
  ];
  const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  for (const s of withImg) {
    for (const i of s.images) {
      csv.push([i.file, s.spot_id, s.name, s.region, s.lat, s.lon, s.osm.beach_type,
        i.license, i.attribution_required, i.share_alike, i.author, i.source_page_url,
        i.attribution_line, i.width, i.height, i.bytes, i.distance_m, i.relevance_score]
        .map(q).join(','));
    }
  }
  fs.writeFileSync(path.join(DATA_DIR, 'spot_images.csv'), `${csv.join('\n')}\n`, 'utf8');

  console.log(
    `docs: ${manifest.counts.images} images / ${manifest.counts.spots_with_images} spots ` +
    '-> data/spot_images.json, data/spot_images.csv, docs/spot-images/'
  );
}

/* ------------------------------------------------------------------ */

async function main() {
  let spots = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  if (REGION_FILTER.length) {
    spots = spots.filter((s) => REGION_FILTER.includes(regionCode(s.crumbs)));
  }
  if (LIMIT) spots = spots.slice(0, LIMIT);
  console.log(`${spots.length} spots in scope`);

  const run = (s) => STAGE === 'all' || STAGE === s;

  let tags = cacheGet('osm_tags') || {};
  if (run('tags')) tags = await stageTags(spots);
  if (run('meta')) await stageMeta(spots, tags);
  if (run('download')) await stageDownload(spots);
  if (run('docs')) writeDocs(buildManifest(spots, tags));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
