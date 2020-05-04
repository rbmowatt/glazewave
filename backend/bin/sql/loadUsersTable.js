var AWS = require("aws-sdk");
var fs = require('fs');
AWS.config.update({
    region: "eu-west-2",
    endpoint: "http://localhost:8000"
});
var docClient = new AWS.DynamoDB.DocumentClient();
console.log("Importing Users into DynamoDB. Please wait.");
var users = JSON.parse(fs.readFileSync('../../data/users.json', 'utf8'));
users.forEach(function(user) {
  console.log(user)
var params = {
        TableName: "users",
        Item: {
            "id": user.id,
            "email": user.email,
            "first_name" : users.first_name,
            "last_name" : user.last_name,
            "role": user.role,
            "gender": user.gender
        }
    };
docClient.put(params, function(err, data) {
       if (err) {
           console.error("Unable to add User", user, ". Error JSON:", JSON.stringify(err, null, 2));
       } else {
           console.log("PutItem succeeded:", user);
       }
    });
});