import { CLEAR_SESSION, SET_SESSION } from './types'
import cognitoUtils from '../lib/utils/cognito'
import Cookie from "js-cookie"

export const clearSession = () => ({
  type: CLEAR_SESSION
})

// Initialise the Cognito sesson from a callback href
export function initSessionFromCallbackURI (callbackHref) {
  return function (dispatch) {
    /** 
    if(Cookie.get("x-token"))
    {
      const session = JSON.parse(Cookie.get("x-token"));
      console.log('session', session);
      dispatch({ type: SET_SESSION, session })
      return;
    }
    **/
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