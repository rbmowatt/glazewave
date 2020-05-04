const { Router }=require('express');

app.get('/', function (req, res) {
    res.send({ title: "Users API Entry Point" })
  })
  app.get('/users', function (req, res) {
  var params = {
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
  console.log("Scanning Users table.");
  docClient.scan(params, onScan);
  function onScan(err, data) {
      if (err) {
          console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          res.send(data)
          // print all the Users
          console.log("Scan succeeded.");
          data.Items.forEach(function(car) {
             console.log(car.id, car.type, car.name)
          });
  if (typeof data.LastEvaluatedKey != "undefined") {
              console.log("Scanning for more...");
              params.ExclusiveStartKey = data.LastEvaluatedKey;
              docClient.scan(params, onScan);
          }
      }
    }
  })
  
  app.get('/users/:id', function (req, res) {
      var userId = parseInt(req.params.id);
        console.log(req.url)
        console.log(userId)
      var params = {
            TableName : "users",
            KeyConditionExpression: "#id = :id",
            ExpressionAttributeNames:{
                "#id": "id"
            },
            ExpressionAttributeValues: {
                ":id": userId
            }
        };
      docClient.query(params, function(err, data) {
          if (err) {
              console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
          } else {
              console.log("Query succeeded.");
              res.send(data.Items)
              data.Items.forEach(function(user) {
                  console.log(user.id, user.first_name, user.last_name);
              });
          }
      });
      });