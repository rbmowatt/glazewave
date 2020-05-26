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
import EditSession from './components/session/Edit';
import SessionView from './components/session/View';

import BoardIndex from './components/board/BoardIndex';
import CreateBoard from './components/board/Create';
import CreateUserBoard from './components/board/CreateUserBoard';
import EditBoard from './components/board/Edit';
import BoardView from './components/board/View';

import LocationIndex from './components/location/LocationIndex';
import CreateLocation from './components/location/Create';
import EditLocation from './components/location/Edit';
import LocationView from './components/location/View';

import ManufacturerIndex from './components/manufacturer/ManufacturerIndex';
import CreateManufacturer from './components/manufacturer/Create';
import EditManufacturer from './components/manufacturer/Edit';
import ManufacturerView from './components/manufacturer/View';

const mapStateToProps = state => {
    return { session: state.session }
}  

class App extends React.Component{
  render() {
    console.log('im hit');
    return (
      <div>
        <Navbar session={this.props.session}  />
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
          <PrivateRoute path={'/session/edit/:id'} exact component={EditSession} session={this.props.session}  />
          <Route  path={'/session/:id'} exact component={SessionView } />

          <Route  path={'/board'} exact component={BoardIndex } />
          <PrivateRoute path={'/board/create'} exact component={CreateUserBoard} session={this.props.session} />
          <PrivateRoute path={'/board/edit/:id'} exact component={EditBoard} session={this.props.session}  />
          <Route  path={'/board/:id'} exact component={BoardView }/>

          <Route  path={'/location'} exact component={LocationIndex } />
          <PrivateRoute path={'/location/create'} exact component={CreateLocation} session={this.props.session} />
          <PrivateRoute path={'/location/edit/:id'} exact component={EditLocation} session={this.props.session}  />
          <Route  path={'/location/:id'} exact component={LocationView }/>

          <Route  path={'/manufacturer'} exact component={ManufacturerIndex } />
          <PrivateRoute path={'/manufacturer/create'} exact component={CreateManufacturer} session={this.props.session} />
          <PrivateRoute path={'/manufacturer/edit/:id'} exact component={EditManufacturer} session={this.props.session}  />
          <Route  path={'/manufacturer/:id'} exact component={ManufacturerView }/>

          <Route component={Page404} />
        </Switch>
      </div>  
    );
  }
}

export default connect(mapStateToProps)(App)
//export default withRouter(App);