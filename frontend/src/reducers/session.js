import { CLEAR_SESSION, SET_SESSION } from '../actions/types';

const initialState = {
  isLoggedIn: false,
  isAdmin: false
}

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