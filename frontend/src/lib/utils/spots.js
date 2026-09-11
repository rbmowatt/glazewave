import axios from 'axios';
import apiConfig from './../../config/api';

const base = () => apiConfig.host + apiConfig.port;

/*
 * Replaces the Algolia surfline_spots index. Returns an empty array when
 * nothing falls inside the radius -- callers must handle that, which the
 * Algolia version was never written to do.
 *
 * Ordering is by driving distance once the server has a road ranking for these
 * coordinates, and straight-line distance until then, so the same request can
 * come back in a different order the second time it is made.
 */
const getSpots = (lat, lon, radius = 50000, limit = 5) =>
  axios
    .get(`${base()}/api/spot/nearest`, {
      params: { lat, lon, radius, limit },
    })
    .then((res) => res.data.spots);

/*
 * Name search, distance-ranked when coords are passed. They are optional on
 * the endpoint, so they are omitted here rather than sent as null -- axios
 * serializes null as an empty value and the server would parse that as NaN.
 */
export const searchSpots = (q, { lat, lon, limit = 8 } = {}) => {
  const params = { q, limit };
  if (lat !== null && lat !== undefined && lon !== null && lon !== undefined) {
    params.lat = lat;
    params.lon = lon;
  }
  return axios
    .get(`${base()}/api/spot/search`, { params })
    .then((res) => res.data.spots);
};

/*
 * Whether a point sits on land that touches open ocean, answered from the
 * committed coastline extract rather than from anything the browser knows.
 *
 * known:false means the extract has no shoreline within reach - a coast outside
 * the boxes in build_coastline.js, or somewhere inland. Callers refuse both,
 * so a real spot in a region that has not been extracted stays unusable until
 * the box is added and the file regenerated. That is deliberate: promotion is
 * on first use, so a guess here puts a wrong row in front of every user.
 */
export const checkCoastal = (lat, lon) =>
  axios
    .get(`${base()}/api/spot/coastal`, { params: { lat, lon } })
    .then((res) => res.data);

/*
 * The locality line under a spot name. Measured across all 1,611 seeded rows:
 * county and state_id are populated on NONE of them, and crumbs is populated on
 * every one in a single shape - "United States, New Jersey". The legacy
 * Surfline import wrote breadCrumbs.toString(), same coarse-to-fine order with
 * more segments, so the last segment is the finest locality either shape
 * carries.
 *
 * Null for the nine contributed spots: nothing on the create path writes
 * crumbs, so callers must not render a label unconditionally.
 */
export const regionLabel = (crumbs) => {
  const parts = String(crumbs || '').split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
};

/*
 * What actually gets rendered under a spot name. city is NULL until the
 * reverse-geocode backfill has run, and stays NULL for offshore and unnamed
 * stretches where no locality exists - so this degrades to the region rather
 * than to a placeholder, and the two cases are indistinguishable on purpose.
 */
export const localityLabel = (spot) => {
  if (!spot) return null;
  const region = regionLabel(spot.crumbs);
  return [spot.city, region].filter(Boolean).join(', ') || null;
};

export default getSpots;
