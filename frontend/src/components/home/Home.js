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
                    <img className="img-fluid rounded mb-4 mb-lg-0" src="https://surfzonemovie.com/wp-content/uploads/2016/01/Bill-Stewart-gets-barrelled-at-famous-break-Cloudbreak-Fiji-900x400.jpg" alt="" />
                  </div>
                  <div className="col-lg-5">
                    <h1 className="font-weight-light">My Surf Sesh</h1>
                    <p>A Free online journal to track your surfing sessions and gain analytics into your performance!</p>
                    <a className="btn btn-primary" href={cognitoUtils.getCognitoSignInUri()}>Sign Up!</a>
                  </div>
              </div>
              <div className="card text-white bg-secondary my-5 py-4 text-center">
                  <div className="card-body">
                    <p className="text-white m-0">This call to action card is a great place to showcase some important information or display a clever tagline!</p>
                  </div>
              </div>
              <div className="row">
                  <div className="col-md-4 mb-5">
                    <div className="card h-100">
                        <div className="card-body">
                          <h2 className="card-title">Track Sessions</h2>
                          <img src={s3Conf.root + 'site/session_example.png'} />
                          <p className="card-text">Track and rate your session then use the stats to decide the best board and location for the swell.</p>
                        </div>
                        <div className="card-footer">
                          <a href="#" className="btn btn-primary btn-sm">Sign Up!</a>
                        </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-5">
                    <div className="card h-100">
                        <div className="card-body">
                          <h2 className="card-title">Showcase Boards</h2>
                          <img src={s3Conf.root + 'site/board_example.png'} />
                          <p className="card-text">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quod tenetur ex natus at dolorem enim! Nesciunt pariatur voluptatem sunt quam eaque, vel, non in id dolore voluptates quos eligendi labore.</p>
                        </div>
                        <div className="card-footer">
                          <a href="#" className="btn btn-primary btn-sm">Sign Up!</a>
                        </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-5">
                    <div className="card h-100">
                        <div className="card-body">
                          <h2 className="card-title">Store Photos</h2>
                          <p className="card-text">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rem magni quas ex numquam, maxime minus quam molestias corporis quod, ea minima accusamus.</p>
                          <h2 className="card-title">Get Reports</h2>
                          <p className="card-text">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rem magni quas ex numquam, maxime minus quam molestias corporis quod, ea minima accusamus.</p>
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