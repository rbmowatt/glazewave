import UserBoardRequests from './../requests/UserBoardRequests';

const initialState = [];
const user_boards = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER_BOARDS':
      return action.payload;
    default:
      return state
  }
}
export default user_boards