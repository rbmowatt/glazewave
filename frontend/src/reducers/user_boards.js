import UserBoardRequests from './../requests/UserBoardRequests';

const initialState = [];
const user_boards = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER_BOARDS':
      return action.payload;
    case 'USER_BOARD_CREATED':
      const s = state.concat(action.payload);
      return s;
    default:
      return state
  }
}
export default user_boards