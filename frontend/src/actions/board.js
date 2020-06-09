import { BOARDS_LOADED } from "./types";
import BoardRequests from './../requests/BoardRequests';

export const BoardsLoaded = data => ({
    type: BOARDS_LOADED,
    payload: data
  });

  export const loadBoards = ( session, args )=>
  {
    return function(dispatch, getState)
    {
      const params = {...args, ...{onSuccess : (data)=>{ return BoardsLoaded(data)} }}
      dispatch(
        new BoardRequests(session).get(params)
      )
    }
  }



  

