import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from './store';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; 
import * as serviceWorker from './serviceWorker';
import ErrorBoundary from './components/ErrorBoundary';
ReactDOM.render(
    <ErrorBoundary>
    <Provider store={store}>
    <BrowserRouter>
        <App />
    </BrowserRouter>
    </Provider>
    </ErrorBoundary>
    , document.getElementById('root')
);
serviceWorker.unregister();