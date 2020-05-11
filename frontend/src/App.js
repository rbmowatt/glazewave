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
 
        <nav className="navbar navbar-expand-lg navbar-dark fixed-top scrolling-navbar">
          <div className="container-fluid">
            <a className="navbar-brand" href="/"><img src="https://umanage-mowatr.s3.amazonaws.com/bake_n_flake_logo_75_75.png" alt="bake n flake bakery"/></a>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#basicExampleNav"
              aria-controls="basicExampleNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="basicExampleNav">
              <ul className="navbar-nav mr-auto">
              {this.props.session.isLoggedIn && this.props.session.isAdmin && 
                <li className="nav-item">
                  <Link className="nav-link" to={'/user'}>
                  Users</Link>
                </li>
              }
               {(this.props.session.isLoggedIn ) &&
                <li className="nav-item">
                  <Link className="nav-link" to={'/recipe'}>
                  Recipes</Link>
                </li>
              }
              </ul>
              <div id="nav_user" className="inline nav-link">
                  {this.props.session.isLoggedIn ? ( <span>Hello {this.props.session.user.userName} </span>) : (<a className="Home-link" href={cognitoUtils.getCognitoSignInUri()}>Sign in</a>)}
             </div>
             {this.props.session.isLoggedIn && 
             <div className="inline nav-link">
                   <a className="Home-link" href="#" onClick={this.onSignOut}>Sign out</a> 
             </div>
             }
            </div>
          </div>
        </nav>
        { (this.props.session) &&
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
        }
      </div>
            
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
//export default withRouter(App);