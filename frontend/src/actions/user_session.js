import { USER_SESSION_CREATED, 
  SET_USER_SESSION, 
  SET_USER_SESSIONS, 
  USER_SESSION_UPDATED, 
  USER_SESSION_CLEARED, 
  USER_SESSION_DELETED, 
  USER_SESSION_LOADED, 
  USER_SESSION_IMAGES_LOADED, 
  USER_SESSION_IMAGES_CREATED, 
  USER_SESSION_IMAGE_DELETED,
  USER_SESSION_CREATED_CLEARED,
  USER_SESSIONS_CLEARED  } from "./types";
import SessionRequests from './../requests/SessionRequests';


export const UserSessionImagesLoaded = data => ({
  type: USER_SESSION_IMAGES_LOADED,
  payload: data
});

export const UserSessionImagesCreated = data => ({
  type: USER_SESSION_IMAGES_CREATED,
  payload: data
});

export const UserSessionCreatedCleared = () => ({
  type: USER_SESSION_CREATED_CLEARED
});

export const UserSessionsCleared = () => ({
  type: USER_SESSIONS_CLEARED
});

const UserSessionImageDeleted = data=> (
  {
    type: USER_SESSION_IMAGE_DELETED,
    payload: data
  }
)

export const UserSessionsLoaded = data => ({
    type: SET_USER_SESSIONS,
    payload: data
  });


export const UserSessionCreated = data => ({
  type: USER_SESSION_CREATED,
  payload: data
});

  export const UserSessionLoaded = data => ({
    type: USER_SESSION_LOADED,
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

  const UserSessionDeleted = data=> (
    {
      type: USER_SESSION_DELETED,
      payload: data
    }
  )

  
export const UserSessionSet = data => (
  {
    type: SET_USER_SESSION,
    payload: data
  }
)

export const createUserSession= ( session, args )=>
{
  return function(dispatch, getState)
  {
    const params = {...args, ...{onSuccess : (data)=>{ return UserSessionCreated(data)} }}
    dispatch(
      new SessionRequests(session).create(params)
    )
  }
}

export const loadUserSessions = (session, args) =>
{
  return function(dispatch, getState)
  {
    const params = {...args, ...{onSuccess : (data)=>{ return UserSessionsLoaded(data)} }}
    dispatch(
      new SessionRequests(session).get(params)
    )
  }
}

export const loadUserSession = ( session, args )=>
{
  return function(dispatch, getState)
  {
    const params = {...args, ...{onSuccess : (data)=>{ return UserSessionLoaded(data)} }}
    dispatch(
      new SessionRequests(session).getOne(params)
    )
  }
}


export const deleteUserSession = (session, id) =>
{
  return function(dispatch, getState)
  {
    const params = { id: id, onSuccess : (data)=>{ return UserSessionDeleted(id)}}
    dispatch(
      new SessionRequests(session).delete(params)
    )
  }
}

export const updateUserSession = (session, args) =>
{
  return function(dispatch, getState)
  {
    const params = {...args, ...{onSuccess : (data)=>{ return UserSessionUpdated(data)} }}
    dispatch(
      new SessionRequests(session).update(params)
    )
  }
}

export const loadUserSessionImages = ( session, args )=>
{
  return function(dispatch, getState)
  {
    const params = {...args, ...{onSuccess : (data)=>{ return UserSessionImagesLoaded(data)} }}
    dispatch(
      new SessionRequests(session).getImages(params)
    )
  }
}

export const addUserSessionImages = ( session, args )=>
{
  return function(dispatch, getState)
  {
    const params = {...args, ...{onSuccess : (data)=>{ return UserSessionImagesCreated(data)} }}
    dispatch(
      new SessionRequests(session).createImages(params)
    )
  }
}

export const deleteUserSessionImage = (session, id) =>
{
  return function(dispatch, getState)
  {
    const params = { id: id, onSuccess : (data)=>{ return UserSessionImageDeleted(id)}}
    dispatch(
      new SessionRequests(session).deleteImage(params)
    )
  }
}
