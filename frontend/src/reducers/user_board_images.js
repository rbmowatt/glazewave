import { s3Conf } from './../config/s3';
import {USER_BOARD_IMAGES_LOADED, USER_BOARD_IMAGES_CREATED, USER_BOARD_IMAGE_DELETED} from './../actions/types';

const INITIAL_STATE_ID = 1;

const initialState = [
    {
        id : INITIAL_STATE_ID ,
        original: "https://surfmemo.s3.amazonaws.com/4b371c1dcc76131241ffe613e30ea51f",
        thumbnail: "https://surfmemo.s3.amazonaws.com/4b371c1dcc76131241ffe613e30ea51f",
    }
];
const session_images = (state = initialState, action) => {
  switch (action.type) {
    case USER_BOARD_IMAGES_LOADED :
      return (action.payload.length > 0) ?  prepImages(action.payload) : initialState;
    case USER_BOARD_IMAGES_CREATED :
      return setImages(state).concat(prepImages(action.payload))
    case USER_BOARD_IMAGE_DELETED :
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