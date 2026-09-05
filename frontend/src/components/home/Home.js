import React, { Component } from 'react'
import './Home.css'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import cognitoUtils from '../../lib/utils/cognito'
import { s3Conf } from './../../config/s3';

const mapStateToProps = state => {
  return { session: state.session }
}

function mapDispatchToProps (dispatch) {
  return {}
}

class Home extends Component {

  componentDidMount () {
    if (this.props.session.isLoggedIn) {
      this.props.history.push('/user/dashboard');
    }
  }

  onSignOut = (e) => {
    e.preventDefault()
    cognitoUtils.signOutCognitoSession()
  }

  render () {
    const signInUri = cognitoUtils.getCognitoSignInUri();
    return (
      <div className="Home">
        <header className="background home-background">
          <section className="gw-hero">
            <div className="gw-hero-copy">
              <div className="gw-hero-eyebrow">Surf session analytics</div>
              <h1>Every session,<br />measured.</h1>
              <p>
                Log where you paddled out, which board you rode and what the ocean
                was doing. Glazewave keeps the numbers, so the pattern shows up on
                its own.
              </p>
              <div className="gw-hero-actions">
                <a className="gw-btn gw-btn-solid" href={signInUri}>Create an account</a>
                <Link className="gw-btn" to={'/session'}>See a sample log</Link>
              </div>
            </div>
            <div className="gw-hero-media">
              <img src="/img/glazewave_index.png" alt="Glazewave session log" />
            </div>
          </section>

          <section className="gw-features">
            <div className="gw-feature">
              <h3>Track sessions</h3>
              <img src={s3Conf.root + 'site/session_example.png'} alt="A logged session" />
              <p>
                Rate a session, then let the stats tell you which board and which
                spot actually suit the swell you get.
              </p>
              <a className="gw-btn" href={signInUri}>Sign up</a>
            </div>
            <div className="gw-feature">
              <h3>Store boards</h3>
              <img src={s3Conf.root + 'site/board_example.png'} alt="A board in the quiver" />
              <p>
                Keep the quiver in one place and see how each board performs as the
                conditions change.
              </p>
              <a className="gw-btn" href={signInUri}>Sign up</a>
            </div>
            <div className="gw-feature">
              <h3>Photos and reports</h3>
              <p>
                Build a gallery from each session, and check local conditions and
                the nearest spots before you go.
              </p>
              <h3>View and share</h3>
              <p>
                Privacy controls decide what other people see. Nothing is public
                unless you make it public.
              </p>
              <a className="gw-btn" href={signInUri}>Sign up</a>
            </div>
          </section>
        </header>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
