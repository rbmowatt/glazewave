const dynamoConfig = require('./../../app/config/dynamo');

const AWS = require("aws-sdk");
AWS.config.update({
    region: dynamoConfig.region,
    endpoint: dynamoConfig.endpoint
});
const dynamodb = new AWS.DynamoDB();
const params = {
    TableName : "recipes",
    KeySchema: [
        { AttributeName: "id", KeyType: "HASH"},  
],
    AttributeDefinitions: [
        { AttributeName: "id", AttributeType: "N" },
],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    }
};

var params2 = {
    TableName: 'recipes'
  };

dynamodb.deleteTable( params2 ,function(err) {
        dynamodb.createTable(params, function(err, data) {
            if (err) {
                console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
            }
        });
})

