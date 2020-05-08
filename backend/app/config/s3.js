require('dotenv').config()
module.exports = {
    apiVersion: '2006-03-01', 
    endpoint: "https://s3.amazonaws.com",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    Bucket: process.env.AWS_S3_BUCKET
}