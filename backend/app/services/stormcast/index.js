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

const round = (n, places = 1) =>
    (n === null || n === undefined) ? null : Number(n).toFixed(places);

const buildConditions = (marine, forecast) => {
    const m = marine.current, mu = marine.current_units;
    const f = forecast.current, fu = forecast.current_units;

    expect(mu, 'wave_height', 'm');
    expect(mu, 'swell_wave_height', 'm');
    expect(mu, 'sea_surface_temperature', '°C');
    expect(fu, 'wind_speed_10m', 'm/s');
    expect(fu, 'pressure_msl', 'hPa');

    return {
        water_temperature: round(C_TO_F(m.sea_surface_temperature), 0),
        swell_height: round(m.swell_wave_height * M_TO_FT, 1),
        swell_period: round(m.swell_wave_period, 0),
        wave_height: round(m.wave_height * M_TO_FT, 1),
        wave_period: round(m.wave_period, 0),
        pressure: round(f.pressure_msl * HPA_TO_INHG, 2),
        wind_speed: round(f.wind_speed_10m * MS_TO_KNOTS, 1),
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
