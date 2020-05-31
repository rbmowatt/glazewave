import { s3Conf } from './../config/s3';

const initialState = [
    {
        original: "https://image.shutterstock.com/image-vector/please-no-photo-camera-vector-260nw-473234290.jpg",
        thumbnail: "https://image.shutterstock.com/image-vector/please-no-photo-camera-vector-260nw-473234290.jpg",
    }
];
const user_board = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_SESSION_IMAGES':
      return (action.payload.length > 0) ?  prepImages(action.payload) : state;
    default:
      return state
  }
}
export default user_board

const prepImages = ( images ) => {
    let formattedImages = [];
    images.forEach(img=>{
        formattedImages.push({
            original: s3Conf.root+ img.name,
            thumbnail: s3Conf.root + img.name,
        })
    })
    return formattedImages;
}