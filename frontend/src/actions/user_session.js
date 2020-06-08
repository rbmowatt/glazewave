import { SET_USER_SESSION, SET_USER_SESSIONS, USER_SESSION_UPDATED, USER_SESSION_CLEARED  } from "./types";


export const UserSessionsLoaded = data => ({
    type: SET_USER_SESSIONS,
    payload: data
  });

  export const UserSessionUpdated= data => ({
    type: USER_SESSION_UPDATED,
    payload: data
  });

  export const UserSessionCleared= () => ({
    type: USER_SESSION_CLEARED,
    payload: null
  });

  
export const UserSessionSet = data => (
  {
    type: SET_USER_SESSION,
    payload: data
  }
)
