
require('dotenv').config()
module.exports = { 
    apiUrl : process.env.API_HOST,
    signoutUri : process.env.API_HOST,
    region : process.env.AWS_DEFAULT_REGION,
    userPool: process.env.AWS_COGNITO_USER_POOL,
    clientId : process.env.AWS_COGNITO_CLIENT_ID
};