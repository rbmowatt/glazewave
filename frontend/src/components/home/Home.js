import React, { Component } from 'react'
import './Home.css'
import { connect } from 'react-redux'
import cognitoUtils from '../../lib/utils/cognito'
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
  constructor (props) {
    super(props)
    this.state = { apiStatus: 'Not called' }
  }

  componentDidMount () {
    //this.props.initSession();
    if (this.props.session.isLoggedIn) {
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
        <div className="intro container-fluid">
        Welcome to MySurfSesh
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