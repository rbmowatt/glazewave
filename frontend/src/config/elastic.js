require('dotenv').config();
module.exports = {
    host : process.env.REACT_APP_ELASTIC_HOST, 
    credentials : process.env.REACT_APP_ELASTIC_CREDS
}