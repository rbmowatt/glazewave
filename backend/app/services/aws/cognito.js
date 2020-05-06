var AWS = require('aws-sdk');
const appConfig = require('./../../config');
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({region: appConfig.region});

// ^ Hard to find that this is the way to import the library, but it was obvious in docs

class Cognito {
    constructor() {
    this.ClientId = appConfig.clientId;
    };

    signup({Username, name, email, phone_number, password}){
        const params = {
            ClientId: this.ClientId,
            Password: password,
            Username: Username,
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
                    Value: phone_number
                }
            ],
        };
        console.log('signup');
        return new Promise((resolve, reject) => {
            console.log('params', params);
            cognitoidentityserviceprovider.signUp(params, function (error, response)
            {
                if (error) return reject(error);
          
                resolve(response);
            })
        });
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

    deleteUser( {userName} )
    {
        const params = {
            UserPoolId: appConfig.userPool,
            Username: userName
        }
        return new Promise((resolve, reject) => {
        console.log('params', params);
        cognitoidentityserviceprovider.adminDeleteUser(params, function (error, response)
        {
            if (error) return reject(error);
      
            resolve(response);
        })
    });
    }

    getUser({ userName })
    {
        const params = {
            UserPoolId: appConfig.userPool,
            Username: userName
        }
        return new Promise((resolve, reject) => {
        console.log('params', params);
        cognitoidentityserviceprovider.adminGetUser(params, function (error, response)
        {
            if (error) return reject(error);
      
            resolve(response);
        })
    });
    }

    updateUser({username, atts}){
        console.log('atts in ', atts);
        const params = {
            UserPoolId: appConfig.userPool,
            Username: username,
            UserAttributes:[ 
            ],
        };
        for (const [key, value] of Object.entries(atts)) {
            params.UserAttributes.push({ Name : key, Value : value});
            console.log(key, value);
          }

        return new Promise((resolve, reject) => {
            console.log('params', params);
            cognitoidentityserviceprovider.adminUpdateUserAttributes(params, function (error, response)
            {
                if (error) return reject(error);
          
                resolve(response);
            })
        });
    }
}

module.exports = Cognito;

