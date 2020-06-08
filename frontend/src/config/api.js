require('dotenv').config();
module.exports = {
    host : process.env.REACT_APP_API_BASE, 
    port : process.env.REACT_APP_API_PORT,
}