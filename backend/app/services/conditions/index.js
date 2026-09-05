const NodeCache = require('node-cache');
const axios = require('axios');
const openMeteoConfig = require('./../../config/openmeteo');
const SurflineSpotService = require('./../SurflineSpotService');

/*
 * One lookup path for every session, past or present. "Now" is just the
 * current UTC hour, so there is no separate live branch to drift out of step
 * with the historical one.
 *
 * Attribution is required under CC BY 4.0.
 */
const myCache = new NodeCache({ stdTTL: 60 * 120, checkperiod: 120 });

const MARINE_HOURLY = [
    'wave_height',
    'wave_period',
    'swell_wave_height',
    'swell_wave_period',
    'sea_surface_temperature',
];

const WEATHER_HOURLY = [
    'wind_speed_10m',
    'pressure_msl',
];

/*
 * The fields that come from the marine model. All five null is how open-meteo
 * reports a grid cell with no water in it, which is both an inland session and
 * a bayside beach whose nearest cell landed on shore. Elevation does not
 * predict it: Mavericks reports 21m and returns full data, La Paz bay reports
 * 30m and returns nothing.
 */
const MARINE_OUTPUT = [
    'water_temperature',
    'swell_height',
    'swell_period',
    'wave_height',
    'wave_period',
];

/*
 * A spot further away than this is not where anyone surfed, so it is only
 * worth borrowing coordinates from when the session's own point produced
 * nothing at all.
 */
const FALLBACK_RADIUS_M = 25000;

const C_TO_F = (c) => (c * 9 / 5) + 32;
const M_TO_FT = 3.28084;
const MS_TO_KNOTS = 1.94384;
const HPA_TO_INHG = 0.02953;

/*
 * The null check happens before the arithmetic. null * 3.28084 is 0 and
 * (null * 9 / 5) + 32 is 32, so guarding the result instead of the input
 * reported an inland point as 32F water and flat rather than as no data.
 */
const convert = (value, transform, places) =>
    (value === null || value === undefined)
        ? null
        : Number(transform(value).toFixed(places));

const AS_IS = (n) => n;

/*
 * The response names the unit of every value it returns. Converting against a
 * unit we assumed rather than one we were given is how a wind speed ends up
 * 3.6x wrong with nothing in the logs, so an unexpected unit fails loudly.
 */
const expectUnit = (units, field, wanted) => {
    const got = units && units[field];
    if (got !== wanted) {
        throw new Error(`open-meteo returned ${field} in "${got}", expected "${wanted}"`);
    }
};

const floorToHourUTC = (at) => {
    const when = (at === null || at === undefined) ? new Date() : new Date(at);
    if (Number.isNaN(when.getTime())) {
        throw new Error(`conditions: "${at}" is not a usable timestamp`);
    }
    when.setUTCMinutes(0, 0, 0);
    return when;
};

const utcDay = (hour) => hour.toISOString().slice(0, 10);

// timezone=UTC makes open-meteo label rows "2026-09-05T12:00", with no offset.
const utcHourLabel = (hour) => `${hour.toISOString().slice(0, 13)}:00`;

const fetchHour = (endpoint, path, params, hour) =>
    axios
        .get(`${endpoint}${path}`, {
            params: Object.assign({}, params, {
                start_date: utcDay(hour),
                end_date: utcDay(hour),
                timezone: 'UTC',
            }),
        })
        .then((res) => {
            const label = utcHourLabel(hour);
            const index = res.data.hourly.time.indexOf(label);
            if (index === -1) {
                throw new Error(`open-meteo returned no ${label} row`);
            }
            return { hourly: res.data.hourly, units: res.data.hourly_units, index };
        });

const marineFor = (lat, lon, hour) =>
    fetchHour(openMeteoConfig.marineEndpoint, '/v1/marine', {
        latitude: lat,
        longitude: lon,
        hourly: MARINE_HOURLY.join(','),
        length_unit: 'metric',
    }, hour);

/*
 * The archive covers 1940 to yesterday; the forecast endpoint covers roughly
 * the last 92 days forward. They overlap, and they disagree - at
 * 2026-09-05T12:00Z the forecast gave 5.68 m/s and the archive 2.59 m/s for
 * the same point, because they are different models. Wind and pressure are
 * therefore not strictly comparable across sessions that straddle this
 * boundary. Splitting at the current hour keeps every past session on one
 * source rather than on whichever happened to be in range that day.
 */
const weatherFor = (lat, lon, hour) => {
    const past = hour < floorToHourUTC(null);
    return fetchHour(
        past ? openMeteoConfig.archiveEndpoint : openMeteoConfig.forecastEndpoint,
        past ? '/v1/archive' : '/v1/forecast',
        {
            latitude: lat,
            longitude: lon,
            hourly: WEATHER_HOURLY.join(','),
            wind_speed_unit: 'ms',
            temperature_unit: 'celsius',
        },
        hour
    );
};

const buildConditions = (marine, weather) => {
    const m = marine.hourly, mi = marine.index;
    const w = weather.hourly, wi = weather.index;

    expectUnit(marine.units, 'wave_height', 'm');
    expectUnit(marine.units, 'swell_wave_height', 'm');
    expectUnit(marine.units, 'sea_surface_temperature', '°C');
    expectUnit(weather.units, 'wind_speed_10m', 'm/s');
    expectUnit(weather.units, 'pressure_msl', 'hPa');

    return {
        water_temperature: convert(m.sea_surface_temperature[mi], C_TO_F, 1),
        swell_height: convert(m.swell_wave_height[mi], (n) => n * M_TO_FT, 1),
        swell_period: convert(m.swell_wave_period[mi], AS_IS, 2),
        wave_height: convert(m.wave_height[mi], (n) => n * M_TO_FT, 1),
        wave_period: convert(m.wave_period[mi], AS_IS, 2),
        pressure: convert(w.pressure_msl[wi], (n) => n * HPA_TO_INHG, 2),
        wind_speed: convert(w.wind_speed_10m[wi], (n) => n * MS_TO_KNOTS, 1),
    };
};

const isBlank = (conditions) =>
    MARINE_OUTPUT.every((field) => conditions[field] === null);

/*
 * Keyed on the point and the hour, never on the spot name. The previous cache
 * keyed on name alone, so adding a timestamp to the request without changing
 * the key would have served one session's swell for another's.
 */
const resolveAt = (lat, lon, hour) => {
    const key = `${lat}|${lon}|${utcHourLabel(hour)}`;
    const cached = myCache.get(key);
    if (cached !== undefined) return Promise.resolve(cached);

    return Promise.all([marineFor(lat, lon, hour), weatherFor(lat, lon, hour)])
        .then(([marine, weather]) => {
            const conditions = buildConditions(marine, weather);
            myCache.set(key, conditions);
            return conditions;
        })
        .catch((e) => {
            const detail = e.response && e.response.data;
            throw detail
                ? new Error(`open-meteo ${e.response.status}: ${JSON.stringify(detail)}`)
                : e;
        });
};

/*
 * The seeded spot table is a fallback for coordinates, not a gate on them.
 * open-meteo answers for any point on earth, so gating the lookup on a 138-row
 * table seeded over two bounding boxes left every session outside New Jersey
 * and Baja with no conditions at all.
 */
const resolve = async ({ lat, lon, at }) => {
    // locations.lat and lng are VARCHAR, so a caller reading straight off the
    // model hands these over as strings. Normalizing here keeps "39.9" and
    // 39.9 on the same cache key instead of fetching the same hour twice.
    const ownLat = Number(lat);
    const ownLon = Number(lon);
    if (!Number.isFinite(ownLat) || !Number.isFinite(ownLon)) {
        throw new Error(`conditions: "${lat},${lon}" is not a usable coordinate`);
    }

    const hour = floorToHourUTC(at);
    const resolvedFor = new Date(hour.getTime());

    const own = await resolveAt(ownLat, ownLon, hour);
    const stamp = (conditions, usedLat, usedLon) =>
        Object.assign({}, conditions, {
            lat: String(usedLat),
            lon: String(usedLon),
            resolved_for: resolvedFor,
            resolved_at: new Date(),
        });

    if (!isBlank(own)) return stamp(own, ownLat, ownLon);

    const spots = await SurflineSpotService.make().nearest({
        lat: ownLat,
        lon: ownLon,
        radius: FALLBACK_RADIUS_M,
        limit: 1,
    });

    const blank = stamp(own, ownLat, ownLon);

    if (!spots.length) return blank;

    // nearest() casts lat and lon to DECIMAL and mysql2 returns those as
    // strings, so they have to be coerced before they reach the query string.
    const spotLat = Number(spots[0].lat);
    const spotLon = Number(spots[0].lon);
    const borrowed = await resolveAt(spotLat, spotLon, hour);
    if (isBlank(borrowed)) return blank;

    return stamp(borrowed, spotLat, spotLon);
};

module.exports = resolve;
module.exports.resolveAt = resolveAt;
module.exports.isBlank = isBlank;
module.exports.MARINE_OUTPUT = MARINE_OUTPUT;
