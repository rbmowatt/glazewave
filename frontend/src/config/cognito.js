
require('dotenv').config()
export const cognitoConfig = { 
    apiUrl : process.env.REACT_APP_API_HOST,
    region : process.env.REACT_APP_AWS_DEFAULT_REGION,
    userPool: process.env.REACT_APP_AWS_COGNITO_USER_POOL,
    clientId : process.env.REACT_APP_AWS_COGNITO_CLIENT_ID,
    userPoolBaseUri : process.env.REACT_APP_AWS_COGNITO_USER_POOL_BASE_URI,
    callbackUri: process.env.REACT_APP_AWS_COGNITO_CALLBACK_URI,
    signoutUri : process.env.REACT_APP_AWS_COGNITO_SIGNOUT_URI,
    tokenScopes: [
    "openid",
    "email",
    "profile"
    ],
    apiUri: process.env.REACT_APP_API_HOST
};