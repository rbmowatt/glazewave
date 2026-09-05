import {USER_LOADED, USER_IMAGE_UPDATED, USER_UPDATED, USER_AVERAGES_LOADED} from './../actions/types';


const initialState = {data : {}, averages : {}};
const user = (state = initialState, action) => {
  let newState = state;
  switch (action.type) {
    case USER_LOADED:
      return {...newState, ...{data :  action.payload}}
    case USER_IMAGE_UPDATED:
      // Spread the existing user: this replaced the whole record, so name,
      // email and username vanished from the store until the next reload.
      return {...newState, ...{data : {...newState.data, profile_img : action.payload.data}}}
    case USER_UPDATED:
      // Spread rather than replace, for the same reason USER_IMAGE_UPDATED
      // does: the PUT response is the saved row and dropping it in whole
      // would blow away anything the record does not carry back.
      return {...newState, ...{data : {...newState.data, ...action.payload}}}
    case USER_AVERAGES_LOADED :
      return {...newState, ...{averages : {...action.payload}}}
    default:
      return state
  }
}
export default user