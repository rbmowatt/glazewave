import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.js';
import './Recipe.css'

const mapStateToProps = state => {
    return { session: state.session }
  }

class RecipeIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { recipes: [], headers : {} }
    }

    componentDidMount(){

        if (this.props.session.isLoggedIn) {
            const headers = { headers: { Authorization: `Bearer ${this.props.session.credentials.accessToken}`}};
            this.setState({headers});
            axios.get( apiConfig.host + ':' + apiConfig.port + `/recipe`, headers).then(data => {
                this.setState({ recipes: data.data })
            });
        }
    }

    deleteRecipe(id ) {
        axios.delete(apiConfig.host + ':' + apiConfig.port + `/recipe/${id}`, this.state.headers).then(data => {
            const index = this.state.recipes.findIndex(recipe => recipe.id === id);
            this.state.recipes.splice(index, 1);
            this.props.history.push('/recipe');
        })
    }

    render() {
        const recipes = this.state.recipes;
        return (
            <div>
                {recipes.length === 0 && (
                    <div className="text-center">
                        <h2>No recipe found at the moment</h2>
                    </div>
                )}
                <div className="container">
                
                    <div className="row">
                    <div className="row newEntity">
                    <Link to={'recipe/create'} className="btn btn-sm btn-outline-secondary"> Create New Recipe</Link>
                    </div>
                        <table className="table table-bordered">
                            <thead className="thead-light">
                                <tr>
                                    <th scope="col">name</th>
                                    <th scope="col">preview</th>
                                    <th scope="col">submitted_by</th>
                                    <th scope="col">Is Public</th>
                                    <th scope="col">Rating</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipes && recipes.map(recipe =>
                                    <tr key={recipe.id}>
                                        <td>{recipe.name}</td>
                                        <td>...</td>
                                        <td>{recipe.submitted_by}</td>
                                        <td>{recipe.isPublic ? '1' : '0'}</td>
                                        <td>{recipe.rating}</td>
                                        <td>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="btn-group" style={{ marginBottom: "20px" }}>
                                                    <Link to={`recipe/${recipe.id}`} className="btn btn-sm btn-outline-secondary">View Recipe </Link>
                                                    <Link to={`recipe/edit/${recipe.id}`} className="btn btn-sm btn-outline-secondary">Edit Recipe </Link>
                                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => this.deleteRecipe(recipe.id)}>Delete Recipe</button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        )
    }
}
export default connect(mapStateToProps)(RecipeIndex)