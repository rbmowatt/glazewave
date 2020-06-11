import {SET_USER_BOARD, SET_USER_BOARDS,  USER_BOARD_CREATED, USER_BOARD_UPDATED, USER_BOARD_DELETED} from './../actions/types';
const initialState = {
  selected : {},
  data : []
};
let newState = null;
const user_boards = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER_BOARD :
      newState = {...state, ...{selected : action.payload}}
      return newState;
    case SET_USER_BOARDS:
      newState = {...state, ...{data : action.payload}}
      return newState;
    case USER_BOARD_CREATED:
      newState = {...state, ...{data : state.data.concat(action.payload)}}
      return newState;
    case USER_BOARD_DELETED :
      const filteredBoards  =  state.data.filter(board => { return board.id !== parseInt(action.payload)});
      newState = {...state, ...{data : filteredBoards}}
      return newState;
    case USER_BOARD_UPDATED :
      newState = {...state, ...{selected : 
        {...state.selected, ...action.payload}
      }}
      return newState;
    default:
      return state
  }
}
export default user_boards