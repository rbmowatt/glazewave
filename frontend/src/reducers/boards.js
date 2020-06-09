import {BOARDS_LOADED} from './../actions/types';

const initialState = { selected : {}, data : []};
let newState = null;
const boards = (state = initialState, action) => {
  switch (action.type) {
    case BOARDS_LOADED:
      newState = {...state, ...{data : action.payload}};
      return newState;
    default:
      return state
  }
}
export default boards