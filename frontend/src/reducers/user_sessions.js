import {USER_SESSION_CLEARED,
  USER_SESSIONS_CLEARED, 
  USER_SESSION_CREATED_CLEARED,  
  USER_SESSION_CREATED, 
  SET_USER_SESSIONS, 
  SESSION_CREATED, 
  DELETE_USER_SESSION, 
  USER_SESSION_UPDATED, 
  USER_SESSION_DELETED, 
  USER_SESSION_LOADED} from './../actions/types';
const initialState = {
  selected : {},
  data : [],
  created : false
};
let newState = null;
const user_sessions = (state = initialState, action) => {
  switch (action.type) {
    case USER_SESSION_LOADED:
      newState = {...state, ...{selected : action.payload}}
      return newState;
    case USER_SESSION_CLEARED:
      newState = {...state, ...{selected : {}}}
      return newState;
    case SET_USER_SESSIONS:
      newState = {...state, ...{data : action.payload}}
      return newState;
    case USER_SESSION_DELETED :
        const filteredSessions  =  state.data.filter(session => { return session.id !== parseInt(action.payload)});
        newState = {...state, ...{data : filteredSessions}}
        return newState;
    case USER_SESSION_CREATED:
      newState = {...state, ...{data : state.data.concat(action.payload), created : action.payload}}
      return newState;
    case DELETE_USER_SESSION:
        newState = state.filter((item) => item.id !== action.payload);
        return newState;
    case USER_SESSION_UPDATED :
        newState = {...state, ...{selected : 
          {...state.selected, ...action.payload}
        }}
        return newState;
    case USER_SESSION_CREATED_CLEARED :
      newState = {...state, ...{created : false}}
      return newState;
    case USER_SESSIONS_CLEARED :
      return initialState;
    default:
        return state
  }
}
export default user_sessions;