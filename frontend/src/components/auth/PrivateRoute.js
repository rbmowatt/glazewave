import React from 'react';
import { Route, Redirect } from 'react-router-dom';

export const PrivateRoute = ({ component: Component, roles, session, ...rest }) => (
    <Route {...rest} render={props => {
        if (!session.isLoggedIn) {
            // not logged in so redirect to login page with the return url
            return <Redirect to={{ pathname: '/', state: { from: props.location } }} />
        }

        // check if route is restricted by role
        if (session.groups.indexOf('Admin') === -1){
            // role not authorised so redirect to home page
            return <Redirect to={{ pathname: '/'}} />
        }

        // authorised so return component
        return <Component {...props} />
    }} />
)