import { SET_USER_BOARDS, USER_BOARD_UPDATED, USER_BOARD_DELETED, SET_USER_BOARD, USER_BOARD_IMAGES_LOADED, USER_BOARD_IMAGES_CREATED, USER_BOARD_IMAGE_DELETED, USER_BOARD_CREATED } from "./types";
import UserBoardRequests from './../requests/UserBoardRequests';


export const UserBoardsLoaded = data => ({
    type: SET_USER_BOARDS,
    payload: data
  });

  export const UserBoardImagesLoaded = data => ({
    type: USER_BOARD_IMAGES_LOADED,
    payload: data
  });

  export const UserBoardImagesCreated = data => ({
    type: USER_BOARD_IMAGES_CREATED,
    payload: data
  });

  export const UserBoardLoaded = data => ({
    type: SET_USER_BOARD,
    payload: data
  });

  export const UserBoardUpdated= data => ({
    type: USER_BOARD_UPDATED,
    payload: data
  });

  const UserBoardDeleted = data=> (
    {
      type: USER_BOARD_DELETED,
      payload: data
    }
  )

  const UserBoardCreated = data=> (
    {
      type: USER_BOARD_CREATED,
      payload: data
    }
  )

  const UserBoardImageDeleted = data=> (
    {
      type: USER_BOARD_IMAGE_DELETED,
      payload: data
    }
  )

  export const createUserBoard = ( session, args )=>
  {
    return function(dispatch, getState)
    {
      const params = {...args, ...{onSuccess : (data)=>{ return UserBoardCreated(data)} }}
      dispatch(
        new UserBoardRequests(session).create(params)
      )
    }
  }


  export const loadUserBoard = ( session, args )=>
  {
    return function(dispatch, getState)
    {
      const params = {...args, ...{onSuccess : (data)=>{ return UserBoardLoaded(data)} }}
      dispatch(
        new UserBoardRequests(session).getOne(params)
      )
    }
  }

  export const loadUserBoards = ( session, args )=>
  {
    return function(dispatch, getState)
    {
      const params = {...args, ...{onSuccess : (data)=>{ return UserBoardsLoaded(data)} }}
      dispatch(
        new UserBoardRequests(session).get(params)
      )
    }
  }

  export const deleteUserBoard = (session, id) =>
  {
    return function(dispatch, getState)
    {
      const params = { id: id, onSuccess : (data)=>{ return UserBoardDeleted(id)}}
      dispatch(
        new UserBoardRequests(session).delete(params)
      )
    }
  }

  export const updateUserBoard = (session, args) =>
  {
    return function(dispatch, getState)
    {
      const params = {...args, ...{onSuccess : (data)=>{ return UserBoardUpdated(data)} }}
      dispatch(
        new UserBoardRequests(session).update(params)
      )
    }
  }

  export const loadUserBoardImages = ( session, args )=>
  {
    return function(dispatch, getState)
    {
      const params = {...args, ...{onSuccess : (data)=>{ return UserBoardImagesLoaded(data)} }}
      dispatch(
        new UserBoardRequests(session).getImages(params)
      )
    }
  }

  export const addUserBoardImages = ( session, args )=>
  {
    return function(dispatch, getState)
    {
      const params = {...args, ...{onSuccess : (data)=>{ return UserBoardImagesCreated(data)} }}
      dispatch(
        new UserBoardRequests(session).createImages(params)
      )
    }
  }

  export const deleteUserBoardImage = (session, id) =>
  {
    return function(dispatch, getState)
    {
      const params = { id: id, onSuccess : (data)=>{ return UserBoardImageDeleted(id)}}
      dispatch(
        new UserBoardRequests(session).deleteImage(params)
      )
    }
  }


  

