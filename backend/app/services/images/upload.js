const aws = require('aws-sdk');
const multer  = require('multer');
const multerS3 = require('multer-s3');
const s3Config = require('./../../config/s3');
const s3 = new aws.S3(s3Config);

const upload = multer({
    storage: multerS3({
      s3: s3,
      acl: 'public-read',
      bucket: s3Config.Bucket,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: function (req, file, cb) {
        cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
        cb(null, Date.now().toString() + file.originalname)
      }
    })
  })

 module.exports = upload;