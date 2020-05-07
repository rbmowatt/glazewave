const dynamoConfig = require('./../../app/config/dynamo');

const AWS = require("aws-sdk");
AWS.config.update({
    region: dynamoConfig.region,
    endpoint: dynamoConfig.endpoint
});
const fs = require('fs');
const docClient = new AWS.DynamoDB.DocumentClient();
console.log("Importing Users into DynamoDB. Please wait.");
const recipes = JSON.parse(fs.readFileSync('../../data/recipes.json', 'utf8'));
recipes.forEach(function(recipe) {
  console.log(recipe)
const params = {
        TableName: "recipes",
        Item: recipe
    };
docClient.put(params, function(err, data) {
       if (err) {
           console.error("Unable to add User", recipe, ". Error JSON:", JSON.stringify(err, null, 2));
       } else {
           console.log("PutItem succeeded:", recipe);
       }
    });
});