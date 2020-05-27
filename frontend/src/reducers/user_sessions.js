const initialState = [];
let newState = null;
const user_sessions = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER_SESSIONS':
      return action.payload;
    case 'SESSION_CREATED':
         newState  = state.concat(action.payload);
        return newState;
    case 'DELETE_USER_SESSION':
          newState = state.filter((item) => item.id !== action.payload);
          return newState;
    default:
      return state
  }
}
export default user_sessions;