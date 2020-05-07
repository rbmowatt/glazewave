import * as React from 'react';
import './App.css';
import { Switch, Route, Link } from 'react-router-dom';
import UserIndex from './components/user/UserIndex';
import RecipeIndex from './components/recipe/RecipeIndex';
import RecipeView from './components/recipe/View';
import Create from './components/user/Create';
import CreateRecipe  from './components/recipe/Create';
import EditRecipe  from './components/recipe/Edit';
import EditCustomer from './components/user/Edit';
import Home from './components/home/Home';
import Page404 from './components/home/Page404';
import Login from './components/home/Login';
import { connect } from 'react-redux';
import { initSession } from './actions/session';
import { PrivateRoute } from './components/auth/PrivateRoute';

const mapStateToProps = state => {
    return { session: state.session }
  }
  
  function mapDispatchToProps (dispatch) {
    return {
      initSession: () => dispatch(initSession())
    }
  }

class App extends React.Component{

  componentDidMount () {
      this.props.initSession();
      console.log('app.props', this.props);
  }

  render() {
    if (!this.props.session.isLoggedIn) {
          return <div />
    }
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
              <Link to={'/recipe'}> Recipes</Link>
            </li>
          </ul>
        </nav>
        <Switch>
          <Route path={'/'} exact component={Home} />
          <Route path={'/login'} exact component={Login} />
          <Route path={'/user'} exact component={UserIndex} />
          <Route path={'/user/create'} exact component={Create} />
          <Route path={'/user/edit/:id'} exact component={EditCustomer} />
          <PrivateRoute path={'/recipe'} exact component={RecipeIndex}  session={this.props.session} />
          <Route path={'/recipe/edit/:id'} exact component={EditRecipe} />
          <Route path={'/recipe/create'} exact component={ CreateRecipe } />
          <Route path={'/recipe/:id'} exact component={RecipeView } />

          <Route component={Page404} />
        </Switch>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
//export default withRouter(App);