import {USER_LOADED} from './../actions/types';


const initialState = {};
const user = (state = initialState, action) => {
  switch (action.type) {
    case USER_LOADED:
      return action.payload;
    default:
      return state
  }
}
export default user