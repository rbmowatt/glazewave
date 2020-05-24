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
          <button type="button" className="navbar-toggler" data-toggle="collapse" data-target="#navbarCollapse">
              <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarCollapse">
              <div className="navbar-nav">
              <a className="navbar-brand" href="/"><img src="https://umanage-mowatr.s3.amazonaws.com/bake_n_flake_logo.png" alt="bake n flake bakery" height="50" width="50"/></a>
              {(props.session.isLoggedIn ) &&
                          <Link className="nav-link" to={'/user/dashboard'}>
                          My Memo</Link>
                      }
 
                {props.session.isLoggedIn && props.session.isAdmin && 
                          <Link className="nav-link" to={'/user'}>
                          Users</Link>
                      }
                {(props.session.isLoggedIn ) &&
                          <Link className="nav-link" to={'/session'}>
                          Sessions</Link>
                      }
                {(props.session.isLoggedIn ) &&
                          <Link className="nav-link" to={'/board'}>
                          Boards</Link>
                      }
                {(props.session.isLoggedIn ) &&
                          <Link className="nav-link" to={'/location'}>
                          Spots</Link>
                      }
                {(props.session.isLoggedIn ) &&
                          <Link className="nav-link" to={'/manufacturer'}>
                          Brands</Link>
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