require('dotenv').config()
module.exports = {
    region: process.env.AWS_DEFAULT_REGION, 
    endpoint: process.env.AWS_DYNAMO_HOST
}