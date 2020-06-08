const aws = require('aws-sdk');
const multer  = require('multer');
const multerS3 = require('multer-s3');
const s3Config = require('./../../config/s3');
const s3Storage = require('multer-sharp-s3');
const s3 = new aws.S3(s3Config);
const moment = require('moment');




 const upload = function upload(destinationPath = '') {
  return multer({
    fileFilter: (req, file, cb) => {
      console.log('s3 req is', req)
      const isValid = true;
      let error = isValid ? null : new Error("Invalid mime type!");
      cb(error, isValid);
    },
    storage: s3Storage({
      limits: 500000,
      acl: "public-read",
      s3,
      Bucket: s3Config.Bucket,
      contentType: s3Storage.AUTO_CONTENT_TYPE,
      resize: {
        fit: 'inside',
        width: 1800,
        height: 1200,
        background: { r: 255, g: 255, b: 255, alpha: 0.5 }
      },
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      Key: function (req, file, cb) {
        cb(null, moment().format('YYMMDD') + "/" + Date.now() + "_" + file.originalname);
      },
    }),
  });
};
module.exports = upload;