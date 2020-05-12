import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';


const mapStateToProps = state => {
    return { session: state.session }
  }

class RecipeIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { recipes: [], headers : {}, isAdmin : false }
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
                        <table className="table table-bordered table-striped table-responsive">
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
                                    <tr key={recipe.id}>
                                        <td>{recipe.name}</td>
                                        <td>{recipe.submitted_by}</td>
                                        <td>{recipe.rating}</td>
                                        <td>{!recipe.isPublic ? 'Yes' : 'No'}</td>
                                        <td>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="btn-group" style={{ marginBottom: "20px" }}>
                                                    <Link to={`recipe/${recipe.id}`} className="btn btn-sm btn-success btn-outline-secondary">View Recipe </Link> 
                                                    { this.state.isAdmin &&  <Link to={`recipe/edit/${recipe.id}`} className="btn btn-warning btn-sm btn-outline-secondary">Edit Recipe </Link> }
                                                    { this.state.isAdmin && <button type="button" className="btn btn-danger btn-sm btn-outline-secondary" onClick={() => this.deleteRecipe(recipe.id)}>Delete Recipe</button> }
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table> )}
                        </div>
                        </div>
                    </div>
                 </div>
            </MainContainer>
          
        )
    }
}
export default connect(mapStateToProps)(RecipeIndex)