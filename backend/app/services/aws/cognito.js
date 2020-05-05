var AWS = require('aws-sdk');
const appConfig = require('./../../config');
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({region: appConfig.region});

// ^ Hard to find that this is the way to import the library, but it was obvious in docs

class Cognito {
    constructor() {
    this.ClientId = appConfig.clientId;
    };

   resHan ( err, data) {
        console.log('handler hit');
        if (err){ console.log(err, err.stack); }
        else{ console.log(data)}
    }

    signup({name, email, phone, password}){
        const params = {
            ClientId: this.ClientId,
            Password: password,
            Username: name,
            UserAttributes:[ 
                {
                    Name: 'name', 
                    Value: name
                },
                {
                    Name: 'email', 
                    Value: email
                }
                ,
                {
                    Name: 'phone_number', 
                    Value: phone
                }
            ],
        };
        console.log('signup');
        cognitoidentityserviceprovider.signUp(params, this.resHan)
    };

    listUsers()
    {
        const params = {
            UserPoolId: appConfig.userPool
        }
        return new Promise((resolve, reject) => {
        console.log('params', params);
        cognitoidentityserviceprovider.listUsers(params, function (error, response)
        {
            if (error) return reject(error);
      
            resolve(response);
        })
    });
    }
}

module.exports = Cognito;

