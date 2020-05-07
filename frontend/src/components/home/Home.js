import React, { Component } from 'react'
//import logo from './logo.svg'
import './Home.css'
import { connect } from 'react-redux'
import cognitoUtils from '../../lib/utils/cognito'
import appConfig from '../../config/cognito.json'
import { initSession } from '../../actions/session';

const mapStateToProps = state => {
  return { session: state.session }
}

function mapDispatchToProps (dispatch) {
  return {
   // initSession: () => dispatch(initSession())
  }
}

class Home extends Component {
  constructor (props) {
    super(props)
    this.state = { apiStatus: 'Not called' }
  }

  componentDidMount () {
    //this.props.initSession();
    if (this.props.session.isLoggedIn) {
      //console.log('token', this.props.session.credentials.accessToken);
      // Call the API server GET /users endpoint with our JWT access token
      const options = {
        url: `${appConfig.apiUri}/user`,
        headers: {
          Authorization: `Bearer ${this.props.session.credentials.accessToken}`
        }
      }
    }
  }

  onSignOut = (e) => {
    e.preventDefault()
    cognitoUtils.signOutCognitoSession()
  }

  render () {
    return (
      <div className="Home">
        <header className="Home-header">
          <img  className="Home-logo" alt="logo" />
          { this.props.session.isLoggedIn ? (
            <div>
              <p>You are logged in as user {this.props.session.user.userName} ({this.props.session.user.email}).</p>
              <p></p>
              <a className="Home-link" href="#" onClick={this.onSignOut}>Sign out</a>
            </div>
          ) : (
            <div>
              <p>You are not logged in.</p>
              <a className="Home-link" href={cognitoUtils.getCognitoSignInUri()}>Sign in</a>
            </div>
          )}
        </header>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Home)