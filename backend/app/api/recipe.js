const { Router } = require('express');
const dynamoConfig = require('../config/dynamo');
const aws = require('aws-sdk');
const multer  = require('multer');
const multerS3 = require('multer-s3');
const s3Config = require('./../config/s3');
const s3 = new aws.S3(s3Config);
aws.config.update({region : dynamoConfig.region, endpoint: dynamoConfig.endpoint});

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


const docClient = new aws.DynamoDB.DocumentClient();

const router = new Router();

router.get('/', function (req, res) {
    const params = {
        TableName: "recipes",
        ProjectionExpression: "#id, #name, #picture, #submitted_by, #recipe, #isPublic, #rating",
        ExpressionAttributeNames: {
            "#id": "id",
            "#picture": "picture",
            "#submitted_by": "submitted_by",
            "#name": "name",
            "#recipe": "recipe",
            "#isPublic": "isPublic",
            "#rating": "rating"
        }
    };
    docClient.scan(params, onScan);
    function onScan(err, data) {
        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
            return res.status(400).json(error);
        } else {
            res.json(data.Items)
            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);
            }
        }
    }
})

router.get('/:id', function (req, res) {
    console.log('dbhost', process.env.DB_HOST);
    const recipeId = parseInt(req.params.id);
    const params = {
        TableName: "recipes",
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames: {
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":id": recipeId
        }
    };
    docClient.query(params, function (err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            return res.status(400).json(error);
        } else {
            console.log("Query succeeded.");
            res.send(data.Items)
        }
    });
});

router.post('/',  upload.single('photo'), function (req, res) {

        console.log('file', req.file);
        const params = {
            TableName: "recipes",
            Item: {
                "id": Date.now(),
                "name": req.body.name || null,
                "picture": req.file.key || null,
                "submitted_by": req.body.submitted_by || null,
                "recipe": req.body.recipe || null,
                "isPublic": req.body.is_public || null,
                "rating": req.body.rating || null,
            }
        };
        docClient.put(params, function (err, data) {
            if (err) {
                console.error("Unable to add User", req.body, ". Error JSON:", JSON.stringify(err, null, 2));
                return res.status(400).json(error);
            } else {
                res.send(data);
                console.log("PutItem succeeded:", data.Item);
            }
        });

});

router.put('/:id', function (req, res) {

    let expression = "SET ";
    let values = {};
    let attributes = {};
    for (const [key, value] of Object.entries(req.body)) {
        expression += "#" + key + "=:" +key + ",";
        attributes["#"+key] = key;
        values[":"+key] = value;
      }
      expression = expression.substring(0, expression.length - 1);
      console.log(expression, values);
    const params = {
        TableName: "recipes",
        Key: {
            id: parseInt(req.params.id)
          },
          UpdateExpression: expression,
          ExpressionAttributeNames: attributes,
          ExpressionAttributeValues: values
    };
    docClient.update(params, function (err, data) {
        if (err) {
            console.error("Unable to add User", req.body, ". Error JSON:", JSON.stringify(err, null, 2));
            res.status(400).json(err);
        } else {
            res.send(data);
            console.log("PutItem succeeded:", data.Items);
        }
    });
});

router.delete('/:id', function (req, res) {
    const recipeId = parseInt(req.params.id);
    const params = {
        TableName: "recipes",
        Key: {
            id: parseInt(req.params.id)
          }
    };
    docClient.delete(params, function (err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            return res.status(400).json(error);
        } else {
            console.log("Query succeeded.");
            res.send(data.Items)
        }
    });
});

module.exports = router;