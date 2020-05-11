import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux'
import { initSessionFromCallbackURI } from '../../lib/utils/cognito';

function mapStateToProps (state) {
  return { session: state.session }
}
function mapDispatchToProps (dispatch) {
  return {
    initSessionFromCallbackURI: href => dispatch(initSessionFromCallbackURI(href))
  }
}

class Login extends Component {
  // If a Cognito auth code is in the URL (could be a hash or query component), init the new session
  componentDidMount () {
    if (this.props.location.hash || this.props.location.search) {
      this.props.initSessionFromCallbackURI(window.location.href)
    }
  }

  render () {
    // If there's no auth code in the URL or we're now logged into, redirect to the root page
    if ((!this.props.location.hash && !this.props.location.search) || this.props.session.isLoggedIn) {
      return <Redirect to="/" />
    }

    return <div />
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Login)