import { connect } from 'react-redux';
import { Switch, Route } from 'react-router-dom';
import './App.css';
import * as React from 'react';
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/auth/PrivateRoute';
import Page404 from './components/home/Page404';
import Home from './components/home/Home';
import Login from './components/home/Login';
import UserIndex from './components/user/UserIndex';

import CreateUser from './components/user/Create';
import EditUser from './components/user/Edit';
import UserDashboard from './components/user/Dashboard';
import SessionIndex from './components/session/SessionIndex';
import CreateSession from './components/session/Create';

import SessionView from './components/session/View';
import BoardIndex from './components/board/BoardIndex';
import CreateUserBoard from './components/board/CreateUserBoard';
import BoardView from './components/board/View';

import { withRouter } from "react-router";
import cognitoUtils from './lib/utils/cognito'


const mapStateToProps = state => {
    return { session: state.session, user : state.user, api : state.api }
}  

class App extends React.Component{

  componentWillUpdate(){
    //listen for any unautorized api calls, if they happen log user out
    if(!this.props.api.authorized) cognitoUtils.signOutCognitoSession();
  }

  render() {
    return (
      <div>
        <Navbar session={this.props.session} username={this.props.user.first_name} />
        <Switch>
          <Route path={'/'} exact component={Home} />
          <Route path={'/login'} exact component={Login} />
          <Route path={'/logout'} exact component={Home} />
          
          <PrivateRoute path={'/user'} exact component={UserIndex} session={this.props.session} />
          <PrivateRoute path={'/user/create'} exact component={CreateUser} session={this.props.session} />
          <PrivateRoute path={'/user/dashboard'} exact component={UserDashboard} session={this.props.session} />
          <PrivateRoute path={'/user/edit/:id'} exact component={EditUser} session={this.props.session}  />
          
          <Route  path={'/session'} exact component={SessionIndex } />
          <PrivateRoute path={'/session/create'} exact component={CreateSession} session={this.props.session} />
          <Route  path={'/session/:id'} exact component={SessionView } />

          <Route  path={'/board'} exact component={BoardIndex } />
          <PrivateRoute path={'/board/create'} exact component={CreateUserBoard} session={this.props.session} />
          <Route  path={'/board/:id'} exact component={BoardView }/>

          <Route component={Page404} />
        </Switch>
      </div>  
    );
  }
}

//export default connect(mapStateToProps)(App)
export default withRouter(connect(mapStateToProps)(App));