require('dotenv').config()

// No accessKeyId/secretAccessKey on purpose: the EC2 instance profile supplies
// credentials via instance metadata, so nothing secret lives on the box.
module.exports = {
    apiVersion: '2006-03-01',
    endpoint: "https://s3.amazonaws.com",
    Bucket: process.env.AWS_S3_BUCKET,
    // Objects are public through the bucket policy in infra/storage.tf rather
    // than ACLs, so a stored key resolves to a plain virtual-hosted URL.
    // Derived from the bucket instead of configured, because the frontend
    // inlines REACT_APP_AWS_S3_ROOT at build time and a second copy would
    // drift. AWS_S3_ROOT overrides it if a CDN ever lands in front.
    publicRoot: process.env.AWS_S3_ROOT
        || `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/`,
}
