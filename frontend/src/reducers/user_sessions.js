import {SET_USER_SESSION, USER_SESSION_CLEARED, SET_USER_SESSIONS, SESSION_CREATED, DELETE_USER_SESSION, USER_SESSION_UPDATED} from './../actions/types';
const initialState = {
  selected : {},
  data : []
};
let newState = null;
const user_sessions = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER_SESSION:
      newState = {...state, ...{selected : action.payload}}
      return newState;
    case USER_SESSION_CLEARED:
      newState = {...state, ...{selected : {}}}
      return newState;
    case SET_USER_SESSIONS:
      newState = {...state, ...{data : action.payload}}
      return newState;
    case SESSION_CREATED:
      newState  = state.concat(action.payload);
      return newState;
    case DELETE_USER_SESSION:
        newState = state.filter((item) => item.id !== action.payload);
        return newState;
    case USER_SESSION_UPDATED :
        newState = {...state, ...{selected : 
          {...state.selected, ...action.payload}
        }}
        return newState;
    default:
        return state
  }
}
export default user_sessions;