const NodeCache = require( "node-cache" );
const myCache = new NodeCache( { stdTTL: 60 * 120, checkperiod: 120 } );
const axios = require("axios");
const openMeteoConfig = require('./../../config/openmeteo');

/*
 * Open-Meteo splits what Stormglass returned in one call: waves and sea surface
 * temperature come from the marine endpoint, wind and pressure from the
 * forecast endpoint. Neither needs an API key for non-commercial use, and the
 * free ceiling is 10,000 calls a day, so two calls per lookup costs nothing.
 *
 * Attribution is required under CC BY 4.0.
 */
const MARINE_CURRENT = [
    'wave_height',
    'wave_period',
    'swell_wave_height',
    'swell_wave_period',
    'sea_surface_temperature',
];

const FORECAST_CURRENT = [
    'wind_speed_10m',
    'pressure_msl',
];

const C_TO_F = (c) => (c * 9 / 5) + 32;
const M_TO_FT = 3.28084;
const MS_TO_KNOTS = 1.94384;
const HPA_TO_INHG = 0.02953;

/*
 * The response names the unit of every value it returns. Converting against a
 * unit we assumed rather than one we were given is how a wind speed ends up
 * 3.6x wrong with nothing in the logs, so an unexpected unit fails loudly.
 */
const expect = (units, field, wanted) => {
    const got = units && units[field];
    if (got !== wanted) {
        throw new Error(`open-meteo returned ${field} in "${got}", expected "${wanted}"`);
    }
};

/*
 * The null check has to happen before the arithmetic, not after. open-meteo
 * returns null for all four marine fields at an inland or land grid point, and
 * null * 3.28084 is 0 while (null * 9 / 5) + 32 is 32 - so guarding the result
 * instead of the input reported Omaha as 32F water and flat rather than as no
 * data at all. Periods were the only fields that ever came back null because
 * they are the only ones never multiplied.
 */
const AS_IS = (n) => n;

const convert = (value, transform, places) =>
    (value === null || value === undefined)
        ? null
        : Number(transform(value)).toFixed(places);

const buildConditions = (marine, forecast) => {
    const m = marine.current, mu = marine.current_units;
    const f = forecast.current, fu = forecast.current_units;

    expect(mu, 'wave_height', 'm');
    expect(mu, 'swell_wave_height', 'm');
    expect(mu, 'sea_surface_temperature', '°C');
    expect(fu, 'wind_speed_10m', 'm/s');
    expect(fu, 'pressure_msl', 'hPa');

    return {
        water_temperature: convert(m.sea_surface_temperature, C_TO_F, 0),
        swell_height: convert(m.swell_wave_height, (n) => n * M_TO_FT, 1),
        swell_period: convert(m.swell_wave_period, AS_IS, 0),
        wave_height: convert(m.wave_height, (n) => n * M_TO_FT, 1),
        wave_period: convert(m.wave_period, AS_IS, 0),
        pressure: convert(f.pressure_msl, (n) => n * HPA_TO_INHG, 2),
        wind_speed: convert(f.wind_speed_10m, (n) => n * MS_TO_KNOTS, 1),
        observed_at: m.time,
    };
};

const getReport = ({lat, lon, name})=>
{
    const cached = myCache.get( name );
    if ( cached !== undefined ) return Promise.resolve(cached);

    const marine = axios.get(`${openMeteoConfig.marineEndpoint}/v1/marine`, {
        params: {
            latitude: lat,
            longitude: lon,
            current: MARINE_CURRENT.join(','),
            length_unit: 'metric',
        },
    });

    const forecast = axios.get(`${openMeteoConfig.forecastEndpoint}/v1/forecast`, {
        params: {
            latitude: lat,
            longitude: lon,
            current: FORECAST_CURRENT.join(','),
            wind_speed_unit: 'ms',
            temperature_unit: 'celsius',
        },
    });

    return Promise.all([marine, forecast])
        .then(([m, f]) => {
            const conditions = buildConditions(m.data, f.data);
            myCache.set( name, conditions );
            return conditions;
        })
        .catch(e => {
            const detail = e.response && e.response.data;
            throw detail
                ? new Error(`open-meteo ${e.response.status}: ${JSON.stringify(detail)}`)
                : e;
        });
}

module.exports = getReport;
