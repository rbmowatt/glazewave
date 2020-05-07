import { CLEAR_SESSION, SET_SESSION } from './types'
import cognitoUtils from '../lib/utils/cognito'
import Cookie from "js-cookie"
import { hasSession } from '../lib/utils/session';


export const clearSession = () => ({
  type: CLEAR_SESSION
})

export function initSession()
{
  return function (dispatch) {
    let session = hasSession();
    if(session)
    {
      cognitoUtils.getCognitoSession();
      dispatch({ type: SET_SESSION, session })
    }
  }
}

// Initialise the Cognito sesson from a callback href
export function initSessionFromCallbackURI (callbackHref) {
  return function (dispatch) {
    return cognitoUtils.parseCognitoWebResponse(callbackHref) // parse the callback URL
      .then(() => cognitoUtils.getCognitoSession()) // get a new session
      .then((session) => {
        Cookie.set("x-token", session);
        dispatch({ type: SET_SESSION, session })
      })
  }
}

export const setSession = session => ({
  type: SET_SESSION,
  session
})