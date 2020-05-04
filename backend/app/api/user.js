const { Router } = require('express');
const uuid = require('uuid');
const shortid = require('shortid');
//shortid.characters('0123456789');
 
const AWS = require("aws-sdk");
AWS.config.update({
    region: "eu-west-2",
    endpoint: "http://localhost:8000"
});
const docClient = new AWS.DynamoDB.DocumentClient();

const router = new Router();

router.get('/', function (req, res) {
    const params = {
        TableName: "users",
        ProjectionExpression: "#id, #email, #first_name, #last_name, #role",
        ExpressionAttributeNames: {
            "#id": "id",
            "#first_name": "first_name",
            "#last_name": "last_name",
            "#email": "email",
            "#role": "role"
        }
    };
    docClient.scan(params, onScan);
    function onScan(err, data) {
        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            res.send(data)
            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);
            }
        }
    }
})

router.get('/:id', function (req, res) {
    const userId = parseInt(req.params.id);
    const params = {
        TableName: "users",
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames: {
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":id": userId
        }
    };
    docClient.query(params, function (err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            console.log("Query succeeded.");
            res.send(data.Items)
        }
    });
});

router.post('/', function (req, res) {
        const params = {
            TableName: "users",
            Item: {
                "id": Date.now(),
                "email": req.body.email || null,
                "first_name": req.body.first_name || null,
                "last_name": req.body.last_name || null,
                "role": req.body.role || null,
                "gender": req.body.gender || null
            }
        };
        docClient.put(params, function (err, data) {
            if (err) {
                console.error("Unable to add User", req.body, ". Error JSON:", JSON.stringify(err, null, 2));
            } else {
                res.send(data);
                console.log("PutItem succeeded:", data.Items);
            }
        });

});

module.exports = router;