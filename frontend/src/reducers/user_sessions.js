const initialState = [];
const user_sessions = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER_SESSIONS':
      return action.payload;
    case 'SESSION_CREATED':
        const s = state.concat(action.payload);
        return s;
    default:
      return state
  }
}
export default user_sessions;