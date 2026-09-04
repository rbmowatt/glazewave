/*
 * No API key: Open-Meteo is open access for non-commercial use. Commercial use
 * moves to a customer- prefixed host, which is why these are configurable.
 */
module.exports = {
    marineEndpoint: process.env.OPEN_METEO_MARINE_ENDPOINT || 'https://marine-api.open-meteo.com',
    forecastEndpoint: process.env.OPEN_METEO_FORECAST_ENDPOINT || 'https://api.open-meteo.com',
}
