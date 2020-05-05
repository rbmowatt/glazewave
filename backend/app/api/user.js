const { Router } = require('express');
const Cognito = require('../services/aws/cognito');
const uuid = require('uuid');
const shortid = require('shortid');
const cognito = new Cognito();;
//shortid.characters('0123456789');
 
const AWS = require("aws-sdk");
AWS.config.update({
    region: "eu-west-2",
    endpoint: "http://localhost:8000"
});
const docClient = new AWS.DynamoDB.DocumentClient();

const router = new Router();

router.get('/', function (req, res) {
    cognito.listUsers().then( (data)=>{
        const users = [];
        data.Users.forEach(user=>{
            user.Attributes.forEach(att=>
                {
                    user[att.Name] = att.Value;
                    console.log('att', att);
                })
                users.push(user);
        })
        console.log('user', users)
        res.json(users);
    })
    .catch(error=>HTMLFormControlsCollection.log('errr', error)); 
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

router.put('/:id', function (req, res) {
    const params = {
        TableName: "users",
        Item: {
            "id": parseInt(req.params.id),
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