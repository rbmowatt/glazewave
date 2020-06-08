import { CLEAR_SESSION, SET_SESSION } from '../actions/types';
import { hasSession } from './../lib/utils/session';

const DEFAULT_SESSION = {
  isLoggedIn: false,
  isAdmin: false
}

const existingSession = hasSession();
const initialState = (existingSession) ? existingSession : DEFAULT_SESSION;

const session = (state = initialState, action) => {
  switch (action.type) {
    case SET_SESSION:
      return Object.assign({},
        action.session,
        { isLoggedIn: true })

    case CLEAR_SESSION:
      return initialState

    default:
      return state
  }
}

export default session