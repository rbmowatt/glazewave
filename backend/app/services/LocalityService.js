/*
 * Resolves a point to a locality, for spots a rider contributes.
 *
 * The batch equivalent is app/scripts/reverse_geocode_spots.js, which filled
 * `city` on 1,026 of the 1,611 seeded rows. This is the live path, and it also
 * fills `crumbs`, which contributed spots have never had at all - nothing on
 * the create path wrote it, so the nine spots added before this carry no
 * locality label of any kind, not even a region.
 *
 * The rules match the batch because they were measured there, over the full
 * 1,611-row harvest:
 *
 *   zoom 14  - zoom 10 answers with the municipality rather than the
 *              settlement (16 of 30 sampled rows came back "Municipio de X"
 *              and no city key), and zoom 16 answers with the nearest road,
 *              whose bounding box the spot does not sit inside.
 *   bbox     - containment, not distance. Distance is to the returned feature's
 *              centroid, so Malibu at 34km long reads as far away while the
 *              label is correct.
 *   no municipality - the Mexican municipio, three rows in the whole harvest
 *              and two of them the worst labels in it: Kanai in Riviera Maya
 *              answering as Playa del Carmen, 55,866m away and inside its box.
 *
 * Dependency-free: global fetch only, no sequelize, so the harvest script can
 * require it without a working node_modules on the Mac.
 */

'use strict';

const UA =
  'glazewave-spot-locality/1.0 (https://glazewave.com; richmowatt@gmail.com)';

const ZOOM = 14;

// Finest first. An unincorporated stretch of coast often has only `hamlet`;
// having none of these is a legitimate answer, not a failure.
const CITY_KEYS = ['city', 'town', 'village', 'hamlet', 'suburb'];

/*
 * Nominatim's policy caps automated use at one request per second and the block
 * is by IP. One call per spot creation is nowhere near that at this volume -
 * nine contributed spots exist in total - but a burst would be, so if spot
 * creation ever becomes something other than rare this needs a queue rather
 * than a faster timeout.
 */
const TIMEOUT_MS = 6000;

/*
 * Returns English names, which is what makes a contributed spot's crumbs match
 * the 1,611 seeded ones. Without it Nominatim answers in the local language and
 * the same country arrives as "México" here and "Mexico" in the seed. Only the
 * last segment is ever rendered, so this would not show - it would just make
 * the column disagree with itself for anyone who later queries it.
 */
const LANGUAGE = 'en';

/*
 * Never throws and never rejects. A spot that cannot be geocoded is an ordinary
 * outcome - 413 of the 1,611 seeded rows resolved to nothing, and 18 of those
 * are points in open water outside every administrative boundary - and a third
 * party being slow is not a reason to fail somebody's spot submission. The
 * caller writes NULL and the UI falls back to the region, or to the name alone.
 */
async function resolve(lat, lon) {
  const empty = { city: null, crumbs: null, locality_source: null };

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return empty;

  try {
    const url =
      'https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1' +
      `&zoom=${ZOOM}&accept-language=${LANGUAGE}` +
      `&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return empty;

    const data = await res.json();
    const address = (data && data.address) || {};

    // [south, north, west, east], as strings.
    const bb = (data && data.boundingbox) || [];
    const inside =
      bb.length === 4 &&
      lat >= Number(bb[0]) && lat <= Number(bb[1]) &&
      lon >= Number(bb[2]) && lon <= Number(bb[3]);

    const key = CITY_KEYS.find((k) => address[k]);

    /*
     * Country first, region second, matching build_spot_seed.js exactly:
     * localityLabel() on the frontend reads the LAST segment, so a reversed
     * pair here would render every contributed spot with its country.
     */
    const crumbs = [address.country, address.state]
      .filter(Boolean)
      .join(', ') || null;

    return {
      city: key && inside ? address[key] : null,
      crumbs: crumbs,
      locality_source: key && inside ? 'nominatim' : null,
    };
  } catch (err) {
    // Timeout, DNS, malformed JSON. Worth a line in journalctl because a run of
    // these means the box lost egress, not that the coast is unmapped.
    console.error('locality lookup failed:', err.message);
    return empty;
  }
}

module.exports = { resolve, CITY_KEYS, ZOOM };
