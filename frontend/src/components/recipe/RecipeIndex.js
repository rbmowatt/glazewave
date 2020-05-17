import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import RecipeRow from './RecipeRow';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css


const mapStateToProps = state => {
    return { session: state.session }
  }

class RecipeIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { recipes: [], headers : {}, isAdmin : false }
        this.deleteRecipe = this.deleteRecipe.bind(this);
        this.editRecipe = this.editRecipe.bind(this);
        this.viewRecipe = this.viewRecipe.bind(this);
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.setState({ isAdmin : this.props.session.isAdmin });
            const headers = { headers: { Authorization: `Bearer ${this.props.session.credentials.accessToken}`}};
            this.setState({headers});
            axios.get( apiConfig.host + apiConfig.port + `/api/recipe`, headers).then(data => {
                data.data.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
                this.setState({ recipes: data.data })
            });
        }
    }

    deleteRecipe(id ) {
        confirmAlert({
            title: 'Confirm To Delete',
            message: 'Are you sure you want to delete this recipe?',
            buttons: [
              {
                label: 'Yes',
                onClick: () => {
                    axios.delete(apiConfig.host + apiConfig.port + `/api/recipe/${id}`, this.state.headers).then(data => {
                        const index = this.state.recipes.findIndex(recipe => recipe.id === id);
                        this.state.recipes.splice(index, 1);
                        this.props.history.push('/recipe');
                    })
                }
              },
              {
                label: 'No',
                onClick: () => {}
              }
            ]
          });
    }

    editRecipe(recipeId) {
        this.props.history.push('/recipe/edit/' + recipeId);
    }

    viewRecipe(recipeId) {
        this.props.history.push('/recipe/' + recipeId);
    }

    render() {
        const recipes = this.state.recipes;
        return (
            <MainContainer>
                <div className="row">
                    <div className="card mx-auto">
                        <div className="card-title"><h2>Recipes
                        { this.state.isAdmin &&  <Link to={'recipe/create'} className="btn btn-sm btn-outline-secondary float-right"> Create New Recipe</Link>}
                        </h2>
                        </div> 
                        <div className="card-text">
                            <div className="table-container" >
                                <div className="row table-header">
                                    <div className="col-6">
                                         Title
                                    </div>
                                    <div className="col-3">
                                        Author
                                    </div>
                                    <div className="col-3">
                                        Info
                                    </div>
                                </div>
                                {recipes && recipes.map(recipe =>
                                (this.state.isAdmin || recipe.isPublic) &&
                                    <RecipeRow recipe={recipe} deleteRecipe={this.deleteRecipe} viewRecipe={this.viewRecipe} editRecipe={this.editRecipe} isAdmin={this.state.isAdmin} key={ recipe.id }/>
                                )
                                }
                                {
                                    (!recipes  || recipes.length === 0) &&  <div className="col-12"><h3>No recipes found at the moment</h3></div>
                                } 
                             </div>
                        </div>
                    </div>
                </div>
            </MainContainer>
          
        )
    }
}
export default connect(mapStateToProps)(RecipeIndex)