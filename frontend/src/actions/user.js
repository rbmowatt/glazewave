import { USER_LOADED, USER_LOGGED_IN} from "./types";
import UserRequests from './../requests/UserRequests';


export const UserLoaded = data => ({
    type: USER_LOADED,
    payload: data
  });

  export const UserLoggedIn = data => ({
    type: USER_LOGGED_IN,
    payload: data
  });


  

  export const loadUser = ( session, args )=>
  {
   
    return function(dispatch, getState)
    {

      console.log('i should be loading user with ', args);
      const params = {...args, ...{onSuccess : (data)=>{ return UserLoaded(data)} }}
      dispatch(
        new UserRequests(session).get(params)
      )
    }
  }