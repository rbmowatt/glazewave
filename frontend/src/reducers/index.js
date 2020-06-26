import { combineReducers } from 'redux'
import session from './session';
import user_board from './user_board';
import user_boards from './user_boards';
import user_session from './user_session';
import user_sessions from './user_sessions';
import user from './user';
import api from './api';
import boards from './boards';
import session_images from './session_images';
import user_board_images from './user_board_images';
import shapers from './shapers';
import stormglass from './stormglass';

export default combineReducers({
  api,
  boards,
  session_images,
  shapers,
  user_board,
  user_boards,
  user_board_images,
  user_session,
  user_sessions,
  session,
  stormglass,
  user
})