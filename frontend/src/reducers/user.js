import {USER_LOADED, USER_IMAGE_UPDATED, USER_AVERAGES_LOADED} from './../actions/types';


const initialState = {data : {}, averages : {}};
const user = (state = initialState, action) => {
  let newState = state;
  switch (action.type) {
    case USER_LOADED:
      return {...newState, ...{data :  action.payload}}
    case USER_IMAGE_UPDATED:
      return {...newState, ...{data : {profile_img : action.payload.data}}}
    case USER_AVERAGES_LOADED :
      console.log('user_averages_loaded')
      return {...newState, ...{averages : {...action.payload}}}
    default:
      return state
  }
}
export default user