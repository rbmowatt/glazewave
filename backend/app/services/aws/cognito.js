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
        return new Promise((resolve, reject) => {
            cognitoidentityserviceprovider.adminCreateUser(params, function (error, response)
            {
                if (error) return reject(error);
          
                resolve(response);
            })
        });
    };

    /*
     * listUsers caps at 60 per call and returns a PaginationToken when there
     * is more. The old version dropped that token, so it silently answered
     * with the first page and looked complete - a failure that only shows up
     * once the 61st rider signs up, as a user who cannot be found in the admin
     * list rather than as an error.
     *
     * The cap is there to stop a runaway loop billing calls against a pool
     * this app will not plausibly reach.
     */
    listUsers({ maxPages = 20 } = {})
    {
        const users = [];
        const fetchPage = (token, page) => new Promise((resolve, reject) => {
            const params = { UserPoolId: cognitoConfig.userPool, Limit: 60 };
            if (token) params.PaginationToken = token;
            cognitoidentityserviceprovider.listUsers(params, function (error, response)
            {
                if (error) return reject(error);
                users.push(...(response.Users || []));
                if (response.PaginationToken && page + 1 < maxPages) {
                    return resolve(fetchPage(response.PaginationToken, page + 1));
                }
                if (response.PaginationToken) {
                    console.error(`listUsers stopped at ${maxPages} pages with more remaining`);
                }
                resolve({ Users: users, truncated: Boolean(response.PaginationToken) });
            })
        });
        return fetchPage(null, 0);
    }

    /*
     * Stops new sign-ins. It does NOT invalidate a token already issued, and
     * cognitoAuth accepts one for up to an hour - which is why users.is_active
     * carries the other half of a disable.
     */
    disableUser({ userName })
    {
        const params = {
            UserPoolId: cognitoConfig.userPool,
            Username: userName
        }
        return new Promise((resolve, reject) => {
        cognitoidentityserviceprovider.adminDisableUser(params, function (error, response)
        {
            if (error) return reject(error);

            resolve(response);
        })
    });
    }

    enableUser({ userName })
    {
        const params = {
            UserPoolId: cognitoConfig.userPool,
            Username: userName
        }
        return new Promise((resolve, reject) => {
        cognitoidentityserviceprovider.adminEnableUser(params, function (error, response)
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
        cognitoidentityserviceprovider.adminGetUser(params, function (error, response)
        {
            if (error) return reject(error);
      
            resolve(response);
        })
    });
    }

    updateUser({username, atts}){
        const params = {
            UserPoolId: cognitoConfig.userPool,
            Username: username,
            UserAttributes:[ 
            ],
        };
        for (const [key, value] of Object.entries(atts)) {
            params.UserAttributes.push({ Name : key, Value : value});
          }

        return new Promise((resolve, reject) => {
            cognitoidentityserviceprovider.adminUpdateUserAttributes(params, function (error, response)
            {
                if (error) return reject(error);
          
                resolve(response);
            })
        });
    }
}

module.exports = Cognito;

