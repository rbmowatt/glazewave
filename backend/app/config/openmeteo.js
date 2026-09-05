/*
 * No API key: Open-Meteo is open access for non-commercial use. Commercial use
 * moves to a customer- prefixed host, which is why these are configurable.
 */
module.exports = {
    marineEndpoint: process.env.OPEN_METEO_MARINE_ENDPOINT || 'https://marine-api.open-meteo.com',
    forecastEndpoint: process.env.OPEN_METEO_FORECAST_ENDPOINT || 'https://api.open-meteo.com',
    // The forecast endpoint refuses a start_date older than about 92 days
    // ("Parameter 'start_date' is out of allowed range"), so wind and pressure
    // for anything older come from the archive instead.
    archiveEndpoint: process.env.OPEN_METEO_ARCHIVE_ENDPOINT || 'https://archive-api.open-meteo.com',
}
