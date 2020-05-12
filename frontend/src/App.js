import { connect } from 'react-redux';
import { Switch, Route } from 'react-router-dom';
import { initSession } from './lib/utils/cognito';
import './App.css';
import * as React from 'react';
import CreateUser from './components/user/Create';
import CreateRecipe  from './components/recipe/Create';
import EditRecipe  from './components/recipe/Edit';
import EditUser from './components/user/Edit';
import Home from './components/home/Home';
import Login from './components/home/Login';
import Navbar from './components/layout/Navbar';
import Page404 from './components/home/Page404';
import PrivateRoute from './components/auth/PrivateRoute';
import RecipeIndex from './components/recipe/RecipeIndex';
import RecipeView from './components/recipe/View';
import UserIndex from './components/user/UserIndex';


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
  }

  
  render() {
    return (
      <div>
        <Navbar session={this.props.session}  />
        <Switch>
          <Route path={'/'} exact component={Home} />
          <Route path={'/login'} exact component={Login} />
          <Route path={'/logout'} exact component={Home} />
          <Route path={'/recipe'} exact component={RecipeIndex} />
          <PrivateRoute  path={'/recipe/edit/:id'} exact component={EditRecipe} session={this.props.session} />
          <PrivateRoute  path={'/recipe/create'} exact component={ CreateRecipe } session={this.props.session} />
          <Route  path={'/recipe/:id'} exact component={RecipeView } />
          <PrivateRoute path={'/user'} exact component={UserIndex} session={this.props.session} />
          <PrivateRoute path={'/user/create'} exact component={CreateUser} session={this.props.session} />
          <PrivateRoute path={'/user/edit/:id'} exact component={EditUser} session={this.props.session}  />
          <Route component={Page404} />
        </Switch>
      </div>  
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
//export default withRouter(App);