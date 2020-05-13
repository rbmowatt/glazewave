const AWS = require('aws-sdk');
const cognitoConfig = require('./../../config/cognito.js');
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({region: cognitoConfig.region});

class Cognito {
    constructor() {
    this.ClientId = cognitoConfig.clientId;
    this.userPool = cognitoConfig.userPool;
    };

    signup({Username, name, email, phone_number, password}){
        const params = {
            UserPoolId: this.userPool,
            Username: Username,
            DesiredDeliveryMediums: [
                'EMAIL'
              ],
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
            cognitoidentityserviceprovider.adminCreateUser(params, function (error, response)
            {
                if (error) return reject(error);
          
                resolve(response);
            })
        });
    };

    listUsers()
    {
        const params = {
            UserPoolId: cognitoConfig.userPool
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
            UserPoolId: cognitoConfig.userPool,
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
            UserPoolId: cognitoConfig.userPool,
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
            UserPoolId: cognitoConfig.userPool,
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

