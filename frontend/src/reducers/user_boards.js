import UserBoardRequests from './../requests/UserBoardRequests';

const initialState = [];
const user_boards = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_USER_BOARDS':
      return action.payload;
    case 'FECTH_USER_BOARDS':
      const boards = [];
      new UserBoardRequests(state.session).get({user_id : state.session.user.id }, ['Board']).then(data=>{
        return data.data;
      })
      //return boards;
    default:
      return state
  }
}
export default user_boards