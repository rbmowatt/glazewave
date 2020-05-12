import React from 'react';
import { Link } from 'react-router-dom';
import cognitoUtils from './../../lib/utils/cognito'

const onSignOut = (e) => {
    e.preventDefault()
    cognitoUtils.signOutCognitoSession()
  }

const Navbar = props =>{
    return (
        <nav className="navbar navbar-expand-md navbar-dark">
          <a className="navbar-brand" href="/"><img src="https://umanage-mowatr.s3.amazonaws.com/bake_n_flake_logo_75_75.png" alt="bake n flake bakery" height="75" width="75"/></a>
          <button type="button" className="navbar-toggler" data-toggle="collapse" data-target="#navbarCollapse">
              <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarCollapse">
              <div className="navbar-nav">
                {props.session.isLoggedIn && props.session.isAdmin && 
                          <Link className="nav-link" to={'/user'}>
                          Users</Link>
                      }
                {(props.session.isLoggedIn ) &&
                          <Link className="nav-link" to={'/recipe'}>
                          Recipes</Link>
                      }
              </div>
              <div className="navbar-nav ml-auto">
              {props.session.isLoggedIn ? ( <span><span className="white-txt">Hello {props.session.user.userName}&nbsp;&nbsp;</span><span><a className="Home-link" href="#" onClick={onSignOut}>Sign out</a> </span></span> ) 
              : (<a className="Home-link" href={cognitoUtils.getCognitoSignInUri()}>Sign in</a>)}
              </div>
          </div>
        </nav>
    )
}
export default Navbar;