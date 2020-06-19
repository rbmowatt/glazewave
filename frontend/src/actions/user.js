import { USER_LOADED, USER_LOGGED_IN, USER_IMAGE_UPDATED} from "./types";
import UserRequests from './../requests/UserRequests';


export const UserLoaded = data => ({
    type: USER_LOADED,
    payload: data
  });

  export const UserLoggedIn = data => ({
    type: USER_LOGGED_IN,
    payload: data
  });

  export const UserImageUpdated = data => ({
    type: USER_IMAGE_UPDATED,
    payload: data
  });


  

  export const logInUser = ( session, args )=>
  {
    return function(dispatch, getState)
    {
      const params = {...args, ...{onSuccess : (data)=>{ return UserLoaded(data)} }}
      dispatch(
        new UserRequests(session).get(params)
      )
    }
  }


  export const loadUser = ( session, args )=>
  {
    return function(dispatch, getState)
    {
      const params = {...args, ...{onSuccess : (data)=>{ return UserLoaded(data)} }}
      dispatch(
        new UserRequests(session).getOne(params)
      )
    }
  }

  export const updateUserImage = ( session, args )=>
  {
    return function(dispatch, getState)
    {
      const params = {...args, ...{onSuccess : (data)=>{ return UserImageUpdated(data)} }}
      dispatch(
        new UserRequests(session).updateProfileImage(params)
      )
    }
  }