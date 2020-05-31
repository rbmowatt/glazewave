import { combineReducers } from 'redux'
import session from './session';
import user_board from './user_board';
import user_boards from './user_boards';
import user_session from './user_session';
import user_sessions from './user_sessions';
import user from './user';
import boards from './boards';
import session_images from './session_images';
import shapers from './shapers';

export default combineReducers({
  boards,
  session_images,
  shapers,
  user_board,
  user_boards,
  user_session,
  user_sessions,
  session,
  user
})