import {CONDITIONS_LOADED} from './../actions/types';

const initialState = { selected : {}, data : []};
let newState = null;
const conditions = (state = initialState, action) => {
  switch (action.type) {
    case CONDITIONS_LOADED:
      newState = {...state, ...{data : action.payload}};
      return newState;
    default:
      return state
  }
}
export default conditions;