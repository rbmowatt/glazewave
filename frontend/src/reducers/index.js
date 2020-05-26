import { combineReducers } from 'redux'
import session from './session';
import user_boards from './user_boards';
import user_sessions from './user_sessions';

export default combineReducers({
  user_boards,
  user_sessions,
  session
})