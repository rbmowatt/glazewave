import { createStore, applyMiddleware, compose } from 'redux'
import rootReducer from '../reducers'
import thunk from 'redux-thunk'
require('dotenv').config()

const storeEnhancers =
  (process.env.REACT_APP_ENV !== 'PROD' &&
    typeof window !== 'undefined' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

const store = createStore(rootReducer,
  storeEnhancers(applyMiddleware(thunk))
)

export default store