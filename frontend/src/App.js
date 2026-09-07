import { connect } from 'react-redux';
import { Switch, Route, Redirect } from 'react-router-dom';
import './App.css';
// Must stay after App.css: App.css @imports bootstrap, and the reskin
// overrides it by source order rather than by specificity.
import './css/instrument.css';
import * as React from 'react';
import Navbar from './components/layout/Navbar';
import Attribution from './components/layout/Attribution';
import PrivateRoute from './components/auth/PrivateRoute';
import Page404 from './components/home/Page404';
import Home from './components/home/Home';
import Login from './components/home/Login';
import Demo from './components/home/Demo';
import UserIndex from './components/user/UserIndex';

import CreateUser from './components/user/Create';
import EditUser from './components/user/Edit';
import UserDashboard from './components/user/Dashboard';
import SessionIndex from './components/session/SessionIndex';

import SessionView from './components/session/View';
import BoardIndex from './components/board/BoardIndex';
import BoardView from './components/board/View';

import { withRouter } from "react-router";
import cognitoUtils from './lib/utils/cognito'
import { loadUser } from './actions/user';


const mapStateToProps = state => {
    return { session: state.session, user : state.user, api : state.api }
}

const mapDispatchToProps = dispatch => {
  return { loadUser: (session, params) => dispatch(loadUser(session, params)) }
}

class App extends React.Component{

  componentWillUpdate(){
    //listen for any unautorized api calls, if they happen log user out
    if(!this.props.api.authorized) cognitoUtils.signOutCognitoSession();
  }

  componentDidMount() { this.ensureUser(); }
  componentDidUpdate() { this.ensureUser(); }

  /*
  Only Dashboard ever loaded the user record, so on every other page the store
  held the empty initial state and the navbar had no name and no photo to show.
  A reload restores the session straight out of localStorage without going near
  getCognitoSession, so login is not a reliable place to do this either.

  requestedFor, rather than a loading flag: a user with no row yet leaves
  user.data empty, and componentDidUpdate runs on every store change, so the
  guard has to survive the request coming back with nothing.
  */
  ensureUser() {
    const { session, user } = this.props;
    const id = session.isLoggedIn && session.user && session.user.id;
    if (!id) return;
    if (user.data && user.data.id) return;
    if (this.requestedFor === id) return;
    this.requestedFor = id;
    this.props.loadUser(session, { id: id });
  }

  render() {
    const user = this.props.user.data || {};
    return (
      <div>
        <Navbar
          session={this.props.session}
          username={user.first_name}
          profileImg={user.profile_img}
        />
        <Switch>
          <Route path={'/'} exact component={Home} />
          <Route path={'/login'} exact component={Login} />
          <Route path={'/demo'} exact component={Demo} />
          <Route path={'/logout'} exact component={Home} />
          
          <PrivateRoute path={'/user'} exact component={UserIndex} session={this.props.session} />
          <PrivateRoute path={'/user/create'} exact component={CreateUser} session={this.props.session} />
          <PrivateRoute path={'/user/dashboard'} exact component={UserDashboard} session={this.props.session} />
          <PrivateRoute path={'/user/edit/:id'} exact component={EditUser} session={this.props.session}  />
          
          <Route  path={'/session'} exact component={SessionIndex } />
          <Route path={'/session/create'} exact render={() => <Redirect to={{ pathname: '/session', state: { createSession: true } }} />} />
          <Route  path={'/session/:id'} exact component={SessionView } />

          <Route  path={'/board'} exact component={BoardIndex } />
          <Route path={'/board/create'} exact render={() => <Redirect to={{ pathname: '/board', state: { createBoard: true } }} />} />
          <Route  path={'/board/:id'} exact component={BoardView }/>

          <Route component={Page404} />
        </Switch>
        <Attribution />
      </div>  
    );
  }
}

//export default connect(mapStateToProps)(App)
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));