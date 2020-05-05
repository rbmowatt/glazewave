import React, { Component } from 'react'
//import logo from './logo.svg'
import './Home.css'
import { connect } from 'react-redux'
import cognitoUtils from '../../lib/utils/cognito'
import request from 'request'
import appConfig from '../../config/cognito.json'

const mapStateToProps = state => {
  return { session: state.session }
}

class Home extends Component {
  constructor (props) {
    super(props)
    this.state = { apiStatus: 'Not called' }
  }

  componentDidMount () {
    if (this.props.session.isLoggedIn) {
      // Call the API server GET /users endpoint with our JWT access token
      const options = {
        url: `${appConfig.apiUri}/user`,
        headers: {
          Authorization: `Bearer ${this.props.session.credentials.accessToken}`
        }
      }
      this.setState({ apiStatus: 'Loading...' })
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

export default connect(mapStateToProps)(Home)