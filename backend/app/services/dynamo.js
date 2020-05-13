const aws = require('aws-sdk');
const dynamoConfig = require('./../config/dynamo');
aws.config.update({
	region: dynamoConfig.region,
	endpoint: dynamoConfig.endpoint
});
const docClient = new aws.DynamoDB.DocumentClient();

class Dynamo {

	static get({TableName,expression}) {
		const params = {
			TableName: TableName,
			ProjectionExpression: expression,
			ExpressionAttributeNames: {}
		};
		const atts = expression.replace(/\s/g, '').split(',');

		atts.forEach(att => {
				params.ExpressionAttributeNames[att] = att.replace('#', '');
			}
		);
		return new Promise((resolve, reject) => {
			docClient.scan(params, onScan);
			function onScan(err, data) {
				if (err) {
					console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
					reject(err)
				} else {
					if (typeof data.LastEvaluatedKey != "undefined") {
						console.log("Scanning for more...");
						params.ExclusiveStartKey = data.LastEvaluatedKey;
						docClient.scan(params, onScan);
                    }
                    resolve(data.Items);
				}
			}
		})
    }
    
    static getItem({TableName, args }) {
        console.log('args',args);
        const params = {
            TableName: TableName,
            KeyConditionExpression: "", //"#id = :id",
            ExpressionAttributeNames: {
               // "#id": "id"
            },
            ExpressionAttributeValues: {
               // ":id": itemId
            }
        };
		return new Promise((resolve, reject) => {
            for (const [key, value] of Object.entries(args)) {
                params.ExpressionAttributeNames["#"+key] = key;
                params.ExpressionAttributeValues[":"+key] = value;
                params.KeyConditionExpression += "#"+key + " = :" + key;
              }
            docClient.query(params, function (err, data) {
                if (err) {
                    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                    reject(err)
                } else {
                    console.log("Query succeeded.");
                    resolve(data.Items)
                }
            });
		})
    }
    
    static create({TableName, item}) {
        const params = {
            TableName: TableName,
            Item: item
        };
		return new Promise((resolve, reject) => {
            docClient.put(params, function (err, data) {
                if (err) {
                    console.error("Unable to add User. Error JSON:", JSON.stringify(err, null, 2));
                    reject(err);
                } else {
                    resolve(data);
                }
            });
		})
	}
}

module.exports = Dynamo;