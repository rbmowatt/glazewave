import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import RecipeRow from './RecipeRow';


const mapStateToProps = state => {
    return { session: state.session }
  }

class RecipeIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { recipes: [], headers : {}, isAdmin : false }
        this.deleteRecipe = this.deleteRecipe.bind(this);
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
        axios.delete(apiConfig.host + apiConfig.port + `/api/recipe/${id}`, this.state.headers).then(data => {
            const index = this.state.recipes.findIndex(recipe => recipe.id === id);
            this.state.recipes.splice(index, 1);
            this.props.history.push('/recipe');
        })
    }


    render() {
        const recipes = this.state.recipes;
        return (
            <MainContainer>
                    <div className="row">
                    <div className="card um-main-body mx-auto">
                        <div className="card-block">
                        <div className="card-title"><strong>Recipes</strong>
                        { this.state.isAdmin &&  <Link to={'recipe/create'} className="btn btn-sm btn-outline-secondary float-right"> Create New Recipe</Link>}
                        </div> 
                        <div className="card-text">
                        {recipes.length === 0 ?(
                            <div className="text-center">
                                <h2>No recipe found at the moment</h2>
                            </div>
                        ) :(
                        <div className="table-responsive-md">
                        <table className="table table-bordered table-striped">
                            <thead className="thead-light">
                                <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Submitted_by</th>
                                    <th scope="col">Rating</th>
                                    <th scope="col">Private?</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipes && recipes.map(recipe =>
                                    (this.state.isAdmin || recipe.isPublic) &&
                                    <RecipeRow recipe={recipe} deleteRecipe={this.deleteRecipe} isAdmin={this.state.isAdmin} key={ recipe.id }/>
                                )}
                            </tbody>
                        </table>
                        </div> )}
                        </div>
                        </div>
                    </div>
                 </div>
            </MainContainer>
          
        )
    }
}
export default connect(mapStateToProps)(RecipeIndex)