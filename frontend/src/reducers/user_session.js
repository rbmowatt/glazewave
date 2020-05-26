const initialState = [];
const user_session = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER_SESSION':
      return action.payload;
    default:
      return state
  }
}
export default user_session;