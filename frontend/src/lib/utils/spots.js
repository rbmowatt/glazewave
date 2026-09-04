import axios from 'axios';
import apiConfig from './../../config/api';

/*
 * Replaces the Algolia surfline_spots index. Returns spots ordered nearest
 * first, and an empty array when nothing falls inside the radius -- callers
 * must handle that, which the Algolia version was never written to do.
 */
const getSpots = (lat, lon, radius = 10000, limit = 5) =>
  axios
    .get(`${apiConfig.host + apiConfig.port}/api/spot/nearest`, {
      params: { lat, lon, radius, limit },
    })
    .then((res) => res.data.spots);

export default getSpots;
