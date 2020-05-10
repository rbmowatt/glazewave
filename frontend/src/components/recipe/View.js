import React, { Component } from 'react'
import { connect } from 'react-redux'
import './Recipe.css'
import axios from 'axios';
import apiConfig from '../../config/api.js';

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
            axios.get( apiConfig.host + apiConfig.port + `/api/recipe/` + this.props.match.params.id, this.state.headers).then(data => {
                ((!this.props.session.isAdmin && !data.data[0].isPublic) || data.data.length === 0) ? this.props.history.push('/recipe') : this.setState({ recipe: data.data[0] });
            })
            .catch(error=>this.props.history.push('/recipe'));
        }
    }

    render() {
        const recipe = this.state.recipe;
        return (
            <div className="main-container">
                <div className="container">
                    <div className="row">
                        <div className="card recipe">
			                <div className="container">
				                <div className="wrapper row">
                                    <div className="preview col-md-6">
                                        <div className="preview-pic tab-content">
                                        <div className="tab-pane active" id="pic-1"><img src={"https://umanage-mowatr.s3.amazonaws.com/" + recipe.picture } alt="recipe" /></div>
                                        </div>
                                    </div>
                                    <div className="details col-md-6">
                                        <h3 className="recipe-title">{recipe.name}</h3>
                                        <h5 className="submitted-by">By <span>{recipe.submitted_by}</span></h5>
                                        <h5 className="review-no">Rated: {recipe.rating}/10</h5>
                                        <div className="rating">
                                            <div className="stars">
                                                <span className="fa fa-star checked"></span>
                                                <span className="fa fa-star checked"></span>
                                                <span className="fa fa-star checked"></span>
                                                <span className="fa fa-star"></span>
                                                <span className="fa fa-star"></span>
                                            </div>
                                        </div>
                                        <h5 className="review-no">Recipe:</h5>
                                        <p className="recipe-description">{ recipe.recipe }</p>
                                    </div>
                                </div>
                            </div>
                        </div>          
                    </div>
                </div>
            </div>
        )
    }
}
export default connect(mapStateToProps)(RecipeView)