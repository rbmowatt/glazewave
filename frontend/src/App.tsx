import * as React from 'react';
import './App.css';
import { Switch, Route, withRouter, RouteComponentProps, Link } from 'react-router-dom';
import UserIndex from './components/user/UserIndex';
import Create from './components/user/Create';
import EditCustomer from './components/user/Edit';
import Home from './components/home/Home';
import Login from './components/home/Login';

class App extends React.Component<RouteComponentProps<any>> {
  public render() {
    return (
      <div>
        <nav>
          <ul>
            <li>
              <Link to={'/'}> Home </Link>
            </li>
            <li>
              <Link to={'/user'}> Users</Link>
            </li>
            <li>
              <Link to={'/create'}> Create</Link>
            </li>
          </ul>
        </nav>
        <Switch>
          <Route path={'/'} exact component={Home} />
          <Route path={'/login'} exact component={Login} />
          <Route path={'/user'} exact component={UserIndex} />
          <Route path={'/create'} exact component={Create} />
          <Route path={'/edit/:id'} exact component={EditCustomer} />
        </Switch>
      </div>
    );
  }
}
export default withRouter(App);