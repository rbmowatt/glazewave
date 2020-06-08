import { CognitoAuth } from 'amazon-cognito-auth-js/dist/amazon-cognito-auth'
import { CognitoUserPool } from 'amazon-cognito-identity-js'
import { config as AWSConfig } from 'aws-sdk'
import { cognitoConfig } from '../../config/cognito.js'
import { clearSession, setSessionCookie } from './session';
import { SET_SESSION } from './../../actions/types';
import apiConfig from '../../config/api.js';
const axios = require('axios');



// Initialise the Cognito sesson from a callback href
export function initSessionFromCallbackURI (callbackHref) {
  return function (dispatch) {
    return parseCognitoWebResponse(callbackHref) // parse the callback URL
      .then(() => getCognitoSession()) // get a new session
      .then((session) => {
        setSessionCookie(session);
        dispatch({ type: SET_SESSION, session })
      })
  }
}

AWSConfig.region = cognitoConfig.region

// Creates a CognitoAuth instance
const createCognitoAuth = () => {
  const appWebDomain = cognitoConfig.userPoolBaseUri.replace('https://', '').replace('http://', '')
  const auth = new CognitoAuth({
    UserPoolId: cognitoConfig.userPool,
    ClientId: cognitoConfig.clientId,
    AppWebDomain: appWebDomain,
    TokenScopesArray: cognitoConfig.tokenScopes,
    RedirectUriSignIn: cognitoConfig.callbackUri,
    RedirectUriSignOut: cognitoConfig.signoutUri
  })
  return auth
}

// Creates a CognitoUser instance
const createCognitoUser = () => {
  const pool = createCognitoUserPool()
  return pool.getCurrentUser()
}

// Creates a CognitoUserPool instance
const createCognitoUserPool = () => new CognitoUserPool({
  UserPoolId: cognitoConfig.userPool,
  ClientId: cognitoConfig.clientId
})

// Get the URI of the hosted sign in screen
const getCognitoSignInUri = () => {
  const signinUri = `${cognitoConfig.userPoolBaseUri}/login?response_type=code&client_id=${cognitoConfig.clientId}&redirect_uri=${cognitoConfig.callbackUri}`
  return signinUri
}

// Parse the response from a Cognito callback URI (assumed a token or code is in the supplied href). Returns a promise.
const parseCognitoWebResponse = (href) => {
  return new Promise((resolve, reject) => {
    const auth = createCognitoAuth()

    // userHandler will trigger the promise
    auth.userhandler = {
      onSuccess: function (result) {
        resolve(result)
      },
      onFailure: function (err) {
        reject(new Error('Failure parsing Cognito web response: ' + err))
      }
    }
    auth.parseCognitoWebResponse(href)
  })
}

// Gets a new Cognito session. Returns a promise.
const getCognitoSession = () => {
  return new Promise((resolve, reject) => {
    const cognitoUser = createCognitoUser()
    cognitoUser.getSession((err, result) => {
      if (err || !result) {
        reject(new Error('Failure getting Cognito session: ' + err))
        return
      }

     console.log('cognito request', result)

      // Resolve the promise with the session credentials
    

      axios.get( apiConfig.host + apiConfig.port + `/api/user/firstOrNew?username=` + result.idToken.payload['cognito:username'] 
      + '&email=' + result.idToken.payload.email + '&first_name=' + result.idToken.payload.given_name + '&last_name=' + result.idToken.payload.family_name
        ).then(data => {
        console.log('getting new session', data.data[0]);
        const session = {
          credentials: {
            //accessToken: result.accessToken.jwtToken,
            //idToken: result.idToken.jwtToken,
            refreshToken: result.refreshToken.token
          },
          user: {
            id : data.data.id,
            userName: result.idToken.payload['cognito:username'],
            email: result.idToken.payload.email
          },
          headers: `Authorization: Bearer ${result.accessToken.jwtToken}`,
          groups : result.idToken.payload['cognito:groups'],
          isAdmin : result.idToken.payload['cognito:groups'] instanceof Array && result.idToken.payload['cognito:groups'].indexOf('Admin') !== -1,
          expiration : result.accessToken.payload.exp,
          isLoggedIn : true
        }
        session.user = {...session.user, ...data.data[0]};
        resolve(session);
      });     

     
    })
  })
}

// Sign out of the current session (will redirect to signout URI)
const signOutCognitoSession = () => {
  clearSession();
  const auth = createCognitoAuth()
  auth.signOut()
}

export default {
  createCognitoAuth,
  createCognitoUser,
  createCognitoUserPool,
  getCognitoSession,
  getCognitoSignInUri,
  parseCognitoWebResponse,
  signOutCognitoSession,
  initSessionFromCallbackURI
}