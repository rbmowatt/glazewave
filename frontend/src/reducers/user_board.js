const initialState = [];
const user_board = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER_BOARD':
      return action.payload;
    default:
      return state
  }
}
export default user_board