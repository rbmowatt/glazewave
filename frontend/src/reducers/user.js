import {USER_LOADED, USER_IMAGE_UPDATED} from './../actions/types';


const initialState = {};
const user = (state = initialState, action) => {
  let newState = state;
  switch (action.type) {
    case USER_LOADED:
      return action.payload;
    case USER_IMAGE_UPDATED:
      return {...newState, ...{profile_img : action.payload.data}}
    default:
      return state
  }
}
export default user