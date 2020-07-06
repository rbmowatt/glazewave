import React, { Component } from 'react'
import './Home.css'
import { connect } from 'react-redux'
import cognitoUtils from '../../lib/utils/cognito'
import { s3Conf } from './../../config/s3';
//import { initSession } from '../../actions/session';

const mapStateToProps = state => {
  return { session: state.session }
}

function mapDispatchToProps (dispatch) {
  return {
   // initSession: () => dispatch(initSession())
  }
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
    return (
      <div className="Home">
        <header className="background home-background">
            <div className="container container-home">
              <div className="row align-items-center my-5">
                  <div className="col-lg-7">
                    <img className="img-fluid rounded mb-4 mb-lg-0" src="/img/glazewave_index.png" alt="" />
                  </div>
                  <div className="col-lg-5">
                    <h1 className="font-weight-light"><img
									className="align-left"
									src="/img/LogoMakr_4GvwRg.png"
									alt="glazewave"
								/></h1>
                    <p>Get Stoked. Get Wet. Get Smart. Get Better.</p>
                   
                  </div>
              </div>
              <div className="card index-cta my-5 py-4 text-center bg-primary">
                    <p>A Free online tool to track your time getting wet and gain analytics into your performance!</p>
                    <p><a className="btn btn-primary" href={cognitoUtils.getCognitoSignInUri()}>Sign Up!</a></p>
              </div>
              <div className="row">
                  <div className="col-md-4 mb-5">
                    <div className="card h-100">
                        <div className="card-body">
                          <h3 className="card-title">Track Sessions</h3>
                          <img src={s3Conf.root + 'site/session_example.png'} />
                          <p className="card-text">Track and rate your session then use the stats to decide the best board and location for the swell!</p>
                        </div>
                        <div className="card-footer">
                            <a className="btn btn-primary" href={cognitoUtils.getCognitoSignInUri()}>Sign Up!</a>
                        </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-5">
                    <div className="card h-100">
                        <div className="card-body">
                          <h3 className="card-title">Store Boards</h3>
                          <img src={s3Conf.root + 'site/board_example.png'} />
                          <p className="card-text">Show your quiver off to friends and the public while keeping track of how each performs in different conditions!.</p>
                        </div>
                        <div className="card-footer">
                          <a className="btn btn-primary" href={cognitoUtils.getCognitoSignInUri()}>Sign Up!</a>
                        </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-5">
                    <div className="card h-100">
                        <div className="card-body">
                          <h3 className="card-title">Stow Photos</h3>
                          <p className="card-text">Create image galleries with your best photos from each session.</p>
                          <h3 className="card-title">Get Reports</h3>
                          <p className="card-text">See your local conditions and nearest spots to surf!</p>
                          <h3 className="card-title">View &amp; Share</h3>
                          <p className="card-text">Privacy controls let each user share and view boards and sessions!<br /><i>(Only if you choose of course. We'll always take your privacy seriously)</i></p>
                        </div>
                        <div className="card-footer">
                          <a href="#" className="btn btn-primary btn-sm">Sign Up!</a>
                        </div>
                    </div>
                  </div>
              </div>
            </div>
        </header>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);

/*
<img  className="Home-logo " alt="logo" src="https://umanage-mowatr.s3.amazonaws.com/bake_n_flake_logo_250_250.png" />
*/