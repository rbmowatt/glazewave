const aws = require('aws-sdk');
const s3Config = require('./../../config/s3');
const s3 = new aws.S3(s3Config);
const multer  = require('multer');
const s3Storage = require('multer-sharp-s3');
const moment = require('moment');
const defaults = {
  destinationPath : 'unsorted',
  fit : 'inside',
  width : 1200,
  height : 900
};
const upload = function upload({destinationPath  = defaults.destinationPath, fit = defaults.fit, width = defaults.width, height = defaults.height} ) {
  return multer({
    fileFilter: (req, file, cb) => {
      const isValid = true;
      let error = isValid ? null : new Error("Invalid mime type!");
      cb(error, isValid);
    },
    storage: s3Storage({
      limits: 500000,
      acl: "public-read",
      s3,
      Bucket: s3Config.Bucket,
      bucket: s3Config.Bucket,
      contentType: s3Storage.AUTO_CONTENT_TYPE,
      resize: {
        fit: fit,
        width: width,
        height: height,
        background: { r: 255, g: 255, b: 255, alpha: 0.5 }
      },
      max : true,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      Key: function (req, file, cb) {
        console.log('dile extension is ', file.mimetype)
        cb(null, destinationPath + "/" + moment().format('YYMMDD') + "/" + Date.now() + "_" + file.originalname);
      },
    }),
  });
};
module.exports = upload;