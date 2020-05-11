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
import { initSession } from './lib/utils/cognito';
import { PrivateRoute } from './components/auth/PrivateRoute';
import cognitoUtils from './lib/utils/cognito'
import 'react-dropdown/style.css';

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

  onSignOut = (e) => {
    e.preventDefault()
    cognitoUtils.signOutCognitoSession()
  }

  render() {
    const options = [
      'one', 'two', 'three'
    ];
    const defaultOption = options[0];
    return (
     
      <div>
        <nav class="navbar navbar-expand-md navbar-dark">
          <a className="navbar-brand" href="/"><img src="https://umanage-mowatr.s3.amazonaws.com/bake_n_flake_logo_75_75.png" alt="bake n flake bakery" height="75" width="75"/></a>
          <button type="button" class="navbar-toggler" data-toggle="collapse" data-target="#navbarCollapse">
              <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarCollapse">
              <div class="navbar-nav">
                {this.props.session.isLoggedIn && this.props.session.isAdmin && 
                          <Link className="nav-link" to={'/user'}>
                          Users</Link>
                      }
                {(this.props.session.isLoggedIn ) &&
                          <Link className="nav-link" to={'/recipe'}>
                          Recipes</Link>
                      }
              </div>
              <div class="navbar-nav ml-auto">
              {this.props.session.isLoggedIn ? ( <span><span className="white-txt">Hello {this.props.session.user.userName}&nbsp;&nbsp;</span><span><a className="Home-link" href="#" onClick={this.onSignOut}>Sign out</a> </span></span> ) : (<a className="Home-link" href={cognitoUtils.getCognitoSignInUri()}>Sign in</a>)}
              </div>
          </div>
        </nav>




        <Switch>
          <Route path={'/'} exact component={Home} />
          <Route path={'/logout'} exact component={Home} />
          <Route path={'/login'} exact component={Login} />
          <PrivateRoute path={'/user'} exact component={UserIndex} session={this.props.session} />
          <PrivateRoute path={'/user/create'} exact component={Create} session={this.props.session} />
          <PrivateRoute path={'/user/edit/:id'} exact component={EditCustomer} session={this.props.session}  />
          <Route path={'/recipe'} exact component={RecipeIndex} />
          <PrivateRoute  path={'/recipe/edit/:id'} exact component={EditRecipe} session={this.props.session} />
          <PrivateRoute  path={'/recipe/create'} exact component={ CreateRecipe } session={this.props.session} />
          <Route  path={'/recipe/:id'} exact component={RecipeView } />
          <Route component={Page404} />
        </Switch>
      </div>
            
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
//export default withRouter(App);