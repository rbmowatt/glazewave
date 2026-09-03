require('dotenv').config()

// No accessKeyId/secretAccessKey on purpose: the EC2 instance profile supplies
// credentials via instance metadata, so nothing secret lives on the box.
module.exports = {
    apiVersion: '2006-03-01',
    endpoint: "https://s3.amazonaws.com",
    Bucket: process.env.AWS_S3_BUCKET
}
