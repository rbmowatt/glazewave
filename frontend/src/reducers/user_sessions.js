const initialState = [];
const user_sessions = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER_SESSIONS':
      return action.payload;
    default:
      return state
  }
}
export default user_sessions;