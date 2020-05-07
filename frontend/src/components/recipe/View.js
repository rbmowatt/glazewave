import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.json';

const mapStateToProps = state => {
    return { session: state.session }
  }

class RecipeView extends Component {
    constructor(props) {
        super(props);
        this.state = { recipe: [], headers : {} }
    }

    componentDidMount(){

        if (this.props.session.isLoggedIn) {
            const headers = { headers: { Authorization: `Bearer ${this.props.session.credentials.accessToken}`}};
            this.setState({headers});
            
            // now lets load our data
            axios.get( apiConfig.host + ':' + apiConfig.port + `/recipe/` + this.props.match.params.id, this.state.headers).then(data => {
                this.setState({ recipe: data.data[0] })
            })
            .catch(error=>console.log(error));
        }
    }

    deleteRecipe(id ) {
        const options = {
            headers: {
              Authorization: `Bearer ${this.props.session.credentials.accessToken}`
            }
          };
        axios.delete(apiConfig.host + ':' + apiConfig.port + `/recipe/${id}`, options).then(data => {
            const index = this.state.recipe.findIndex(recipe => recipe.id === id);
            this.state.recipe.splice(index, 1);
            this.props.history.push('/recipe');
        })
    }

    render() {
        const recipe = this.state.recipe;
        return (
            <div>
                {recipe.length === 0 && (
                    <div className="text-center">
                        <h2>No Recipes found at the moment</h2>
                    </div>
                )}
                <div className="container">
                    <div className="row">
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
                                    <tr key={recipe.id}>
                                        <td>{recipe.name}</td>
                                        <td>{ recipe.recipe }...</td>
                                        <td>{recipe.submitted_by}</td>
                                        <td>{recipe.isPublic ? '1' : '0'}</td>
                                        <td>{recipe.rating}</td>
                                        <td>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="btn-group" style={{ marginBottom: "20px" }}>
                                                    <Link to={`recipe/${recipe.id}`} className="btn btn-sm btn-outline-secondary">Edit Recipe </Link>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        )
    }
}
export default connect(mapStateToProps)(RecipeView)