import { s3Conf } from './../config/s3';
import {USER_SESSION_IMAGES_LOADED, USER_SESSION_IMAGES_CREATED, USER_SESSION_IMAGE_DELETED} from './../actions/types';

const INITIAL_STATE_ID = 1;

/*
 * Which stand-in a session gets depends on its id, and a reducer has none, so
 * the entry is flagged instead and the session page swaps the urls in when it
 * renders. The flag rather than the id is what View matches on: INITIAL_STATE_ID
 * is 1, and a real SessionImage can be id 1 too.
 */
const initialState = [
    {
        id : INITIAL_STATE_ID ,
        placeholder: true,
        original: "/img/session_default_lg.png",
        thumbnail: "/img/session_default_lg.png",
    }
];
const session_images = (state = initialState, action) => {
  switch (action.type) {
    case USER_SESSION_IMAGES_LOADED:
      return (action.payload.length > 0) ?  prepImages(action.payload) : initialState;
    case USER_SESSION_IMAGES_CREATED :
      return setImages(state).concat(prepImages(action.payload))
    case USER_SESSION_IMAGE_DELETED :
      const newState =  state.filter(img => { return img.id !== parseInt(action.payload)});
      return (newState.length) ? newState : initialState;
    default:
      return state
  }
}
export default session_images;

const setImages = (state) =>
{
  return  state.filter(img=>{return img.id !== INITIAL_STATE_ID });
}

const prepImages = ( images ) => {
    let formattedImages = [];
    images.forEach(img=>{
        formattedImages.push({
            id : img.id,
            original: s3Conf.root+ img.name,
            thumbnail: s3Conf.root + img.name,
        })
    })
    return formattedImages;
}