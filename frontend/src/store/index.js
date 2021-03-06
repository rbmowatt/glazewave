import { createStore, applyMiddleware, compose } from 'redux'
import rootReducer from '../reducers'
import thunk from 'redux-thunk'
import api from './../middleware/api';
require('dotenv').config()

const storeEnhancers =
  (process.env.REACT_APP_ENV !== 'PROD' &&
    typeof window !== 'undefined' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

const store = createStore(rootReducer,
  storeEnhancers(applyMiddleware(thunk, api))
)

export default store