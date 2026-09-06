import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux'
import { startDemoSession } from './../../lib/utils/demo'
import { setSessionCookie } from './../../lib/utils/session'
import TokenStorage from './../../lib/utils/token_storage'
import { SET_SESSION } from './../../actions/types'
import { loadUser } from './../../actions/user'

function mapStateToProps (state) {
  return { session: state.session }
}

function mapDispatchToProps (dispatch) {
  return {
    signIn: (key) => startDemoSession(key).then(session => {
      TokenStorage.setToken({ access_token: session.jwt, refresh_token: null })
      setSessionCookie(session)
      dispatch({ type: SET_SESSION, session })
      // getOne takes id, not wheres. The Cognito path passes an email here and
      // fetches /api/user/null for it.
      dispatch(loadUser(session, { id: session.user.id }))
      return session
    })
  }
}

class Demo extends Component {
  state = { failed: false }

  componentDidMount () {
    if (this.props.session.isLoggedIn) return
    const key = new URLSearchParams(this.props.location.search).get('k')
    this.props.signIn(key).catch(() => this.setState({ failed: true }))
  }

  render () {
    if (this.props.session.isLoggedIn) {
      return <Redirect to="/user/dashboard" />
    }
    if (this.state.failed) {
      return (
        <div className="background home-background">
          <section className="gw-hero">
            <div className="gw-hero-copy">
              <h1>Demo unavailable</h1>
              <p>This demo link is not valid right now. Try the site itself instead.</p>
            </div>
          </section>
        </div>
      )
    }
    return <div />
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Demo)
