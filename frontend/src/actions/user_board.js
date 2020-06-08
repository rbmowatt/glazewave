import { SET_USER_BOARDS, USER_BOARD_UPDATED } from "./types";


export const UserBoardsLoaded = data => ({
    type: SET_USER_BOARDS,
    payload: data
  });

  export const UserBoardUpdated= data => ({
    type: USER_BOARD_UPDATED,
    payload: data
  });


  

