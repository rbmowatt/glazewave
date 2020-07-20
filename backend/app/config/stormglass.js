require('dotenv').config()
module.exports = {
    endpoint: process.env.STORMGLASS_API_ENDPOINT,
    key: process.env.STORMGLASS_API_KEY
}