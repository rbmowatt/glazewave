import { SHAPERS_LOADED } from "./types";
import ManufacturerRequests from './../requests/ManufacturerRequests';


export const ShapersLoaded = data => ({
    type: SHAPERS_LOADED,
    payload: data
  });



  export const loadShapers= ( session, args )=>
  {
    return function(dispatch, getState)
    {
      const params = {...args, ...{onSuccess : (data)=>{ return ShapersLoaded(data)} }}
      dispatch(
        new ManufacturerRequests(session).get(params)
      )
    }
  }



  

