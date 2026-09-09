const EARTH_RADIUS_M = 6371008.8;

/*
 * Straight line, matching the ST_Distance_Sphere the nearest query uses.
 *
 * The nearest-spots panel can print a larger number for the same pair, because
 * /api/spot/nearest reorders by road distance when the server has a ranking for
 * those coordinates: 42.7km of ocean between a La Paz point and Playa El
 * Tecolote is 65.1km of driving. Nothing here is a route, so straight line is
 * the honest measure of how far away a reading came from.
 */
export const metresBetween = (aLat, aLon, bLat, bLon) => {
    const lat1 = (Number(aLat) * Math.PI) / 180;
    const lat2 = (Number(bLat) * Math.PI) / 180;
    const dLat = lat2 - lat1;
    const dLon = ((Number(bLon) - Number(aLon)) * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
};

/*
 * Under this the two points are the same place and the difference is rounding.
 * Both coordinates travel as VARCHAR - locations.lat/lng and session_data
 * lat/lon are both strings - so "24.10" and "24.1" describe one point and
 * compare unequal. A real borrow is a different beach and never this close.
 */
const SAME_POINT_M = 1000;

/*
 * How far the reading came from, when open-meteo had no wave data at the point
 * that was asked about and the backend borrowed the nearest seeded spot
 * instead. Null when the reading is the place itself, which is the normal case.
 *
 * Derived rather than stored: session_data.lat/lon already records the point
 * that answered, so this reads correctly for rows written before the borrow
 * radius was widened.
 */
const usable = (value) => {
    // Number(null) is 0 and Number('') is 0, both of which Number.isFinite
    // accepts. A session_data row written before conditions were ever resolved
    // carries null lat and lon, and treating those as the equator reported a
    // local reading as borrowed from 12,084 km away.
    if (value === null || value === undefined || value === '') return false;
    return Number.isFinite(Number(value));
};

export const borrowedMetres = (origin, resolved) => {
    if (!origin || !resolved) return null;
    if (!usable(origin.lat) || !usable(origin.lon)) return null;
    if (!usable(resolved.lat) || !usable(resolved.lon)) return null;
    const metres = metresBetween(origin.lat, origin.lon, resolved.lat, resolved.lon);
    return metres < SAME_POINT_M ? null : metres;
};

export const asKm = (metres) =>
    metres === null || metres === undefined ? null : `${(metres / 1000).toFixed(1)} km`;
