import {SHAPERS_LOADED} from './../actions/types';

const initialState = { selected : {}, data : []};
let newState = null;
const shapers = (state = initialState, action) => {
  switch (action.type) {
    case SHAPERS_LOADED:
      newState = {...state, ...{data : action.payload}};
      return newState;
    default:
      return state
  }
}
export default shapers;