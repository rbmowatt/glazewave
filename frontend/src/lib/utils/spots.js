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

export default getSpots;
