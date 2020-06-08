const aws = require('aws-sdk');
const s3Config = require('./../../config/s3');
const s3 = new aws.S3(s3Config);

const deletes3Image = (filekey)=>
{
    return new Promise((resolve, reject)=>
    {
        s3.deleteObject({  
            Bucket: s3Config.Bucket,
            Key: filekey
        },function (err,data){
            if(err) reject(err);
            resolve(data);
            }
        )
    })

}

module.exports = deletes3Image;