/*
 * One formatter for every distance the app prints, so a spot 42,716m away is
 * "42.7 km" in the nearest-spots list, on a session and under the local report
 * rather than three roundings of the same number.
 *
 * Metres in, because that is what both sources speak: /api/spot/nearest and
 * session_data.borrowed_m are road metres once OSRM has a ranking for the
 * origin and straight-line metres until then, never a mix inside one response.
 */
export const asKm = (metres) =>
    metres === null || metres === undefined ? null : `${(metres / 1000).toFixed(1)} km`;
