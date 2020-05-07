const { Router } = require('express');

const AWS = require("aws-sdk");
AWS.config.update({
    region: "eu-west-2",
    endpoint: "http://localhost:8000"
});
const docClient = new AWS.DynamoDB.DocumentClient();

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
        } else {
            console.log("Query succeeded.");
            res.send(data.Items)
        }
    });
});

router.post('/', function (req, res) {
        const params = {
            TableName: "recipes",
            Item: {
                "id": Date.now(),
                "name": req.body.name || null,
                "picture": req.body.picture || null,
                "submitted_by": req.body.submitted_by || null,
                "recipe": req.body.recipe || null,
                "isPublic": req.body.is_public || null,
                "rating": req.body.rating || null,
            }
        };
        docClient.put(params, function (err, data) {
            if (err) {
                console.error("Unable to add User", req.body, ". Error JSON:", JSON.stringify(err, null, 2));
            } else {
                res.send(data);
                console.log("PutItem succeeded:", data.Item);
            }
        });

});

router.put('/:id', function (req, res) {
    const params = {
        TableName: "recipes",
        Item: {
            "id": parseInt(req.params.id),
            "name": req.body.name || null,
            "picture": req.body.picture || null,
            "submitted_by": req.body.submitted_by || null,
            "recipe": req.body.recipe || null,
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
        } else {
            console.log("Query succeeded.");
            res.send(data.Items)
        }
    });
});

module.exports = router;