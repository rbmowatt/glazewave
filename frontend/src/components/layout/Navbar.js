import React from 'react';
import { NavLink } from 'react-router-dom';
import cognitoUtils from './../../lib/utils/cognito'
import './css/Nav.css'

const onSignOut = (e) => {
    e.preventDefault()
    cognitoUtils.signOutCognitoSession()
  }

const Navbar = props =>{
    const { isLoggedIn } = props.session;
    return (
        <nav className="navbar navbar-expand-md">
          <button type="button" className="navbar-toggler" data-toggle="collapse" data-target="#navbarCollapse">
              <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarCollapse">
              <div className="navbar-nav align-items-center">
                <a className="gw-brand mr-4" href="/">
                  <span className="gw-brand-mark" />
                  <span>glazewave</span>
                </a>
                {isLoggedIn &&
                  <NavLink className="nav-link" activeClassName="active" to={'/user/dashboard'}>Dashboard</NavLink>
                }
                {isLoggedIn &&
                  <NavLink className="nav-link" activeClassName="active" to={'/session'}>Sessions</NavLink>
                }
                {isLoggedIn &&
                  <NavLink className="nav-link" activeClassName="active" to={'/board'}>Boards</NavLink>
                }
              </div>
              <div className="navbar-nav ml-auto gw-nav-user">
              {isLoggedIn ? (
                <>
                  <span className="white-txt">{props.username}</span>
                  <button type="button" className="gw-link" onClick={onSignOut}>SIGN OUT</button>
                  <span className="gw-nav-avatar" />
                </>
              ) : (
                <a className="gw-link" href={cognitoUtils.getCognitoSignInUri()}>SIGN IN</a>
              )}
              </div>
          </div>
        </nav>
    )
}
export default Navbar;
