require('dotenv').config()
const dynamoConfig = {
    region: process.env.AWS_DEFAULT_REGION, 
    endpoint: process.env.AWS_DYNAMO_HOST
}
module.exports = dynamoConfig;