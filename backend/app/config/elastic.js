require('dotenv').config()
const elasticConfig= {
    host: process.env.ELASTIC_SEARCH_HOST, 
}
module.exports = elasticConfig;