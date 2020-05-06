var AWS = require("aws-sdk");
AWS.config.update({
    region: "eu-east-1",
    endpoint: "http://localhost:8000"
  });
var docClient = new AWS.DynamoDB.DocumentClient()
var table = "recipes";
var id = 1000;
var params = {
    TableName: table,
    Key:{
        "id": id
    }
};
docClient.get(params, function(err, data) {
    if (err) {
        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
    }
});