import React from 'react';
import { NavLink } from 'react-router-dom';
import cognitoUtils from './../../lib/utils/cognito'
import { isDemoPublic } from './../../lib/utils/demo'
import { s3Conf } from './../../config/s3'
import './css/Nav.css'

const onSignOut = (e) => {
    e.preventDefault()
    cognitoUtils.signOutCognitoSession()
  }

const Navbar = props =>{
    const { isLoggedIn, isAdmin } = props.session;
    return (
        <nav className="navbar navbar-expand-md">
          <button type="button" className="navbar-toggler" data-toggle="collapse" data-target="#navbarCollapse">
              <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarCollapse">
              <div className="navbar-nav align-items-center">
                <a className="gw-brand mr-4" href="/">
                  <img src="/img/glazewave_lockup.png" alt="Glazewave" />
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
                {/* An anchor, not a NavLink: /admin is the separate Vite bundle
                    nginx serves, so react-router would match it against these
                    routes and render the 404 page without ever leaving the SPA.
                    The link is convenience only - requireAdmin is the gate. */}
                {isLoggedIn && isAdmin &&
                  <a className="nav-link" href="/admin">Admin</a>
                }
              </div>
              <div className="navbar-nav ml-auto gw-nav-user">
              {isLoggedIn ? (
                <>
                  <span className="white-txt">{props.username}</span>
                  <button type="button" className="gw-link" onClick={onSignOut}>SIGN OUT</button>
                  {/* The empty span stays the fallback: a rider with no photo
                      still gets the circle rather than a broken image icon. */}
                  {props.profileImg
                    ? <img className="gw-nav-avatar" src={s3Conf.root + props.profileImg} alt="" />
                    : <span className="gw-nav-avatar" />}
                </>
              ) : (
                <>
                  {isDemoPublic() &&
                    <NavLink className="gw-link" to={'/demo'}>TRY THE DEMO</NavLink>
                  }
                  <a className="gw-link" href={cognitoUtils.getCognitoSignInUri()}>SIGN IN</a>
                </>
              )}
              </div>
          </div>
        </nav>
    )
}
export default Navbar;
