import {STORMGLASS_LOADED} from './../actions/types';

const initialState = { selected : {}, data : []};
let newState = null;
const stormglass = (state = initialState, action) => {
  switch (action.type) {
    case STORMGLASS_LOADED:
      newState = {...state, ...{data : action.payload}};
      return newState;
    default:
      return state
  }
}
export default stormglass;