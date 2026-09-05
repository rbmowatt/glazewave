
import apiConfig from './../../../../config/api';

/*
 * Resolved against the location's own coordinates, and against a timestamp
 * when one is given. This used to find the nearest seeded spot first and give
 * up when there was none, which left every session outside New Jersey and Baja
 * with no conditions at all - open-meteo answers for any point on earth, and
 * the backend borrows a nearby spot itself when a point has no marine data.
 *
 * An all-null payload is a real answer, not a failure: it means the point was
 * checked and has no marine data. Conditions renders that differently from a
 * session whose conditions were never looked up.
 */
export const getSessionData = (lat, lng, at) => {
    const query = `lat=${lat}&lon=${lng}` + (at ? `&at=${encodeURIComponent(at)}` : '');
    return fetch(`${apiConfig.host + apiConfig.port}/api/sc?${query}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Conditions lookup failed (${response.status}).`);
            }
            return response.json();
        });
};
