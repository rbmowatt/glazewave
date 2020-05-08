import React, { Component } from 'react'
import { connect } from 'react-redux'
import './Recipe.css'
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
        <div className="card recipe">
			<div className="container">
				<div className="wrapper row">
					<div className="preview col-md-6">
						<div className="preview-pic tab-content">
						  <div className="tab-pane active" id="pic-1"><img src={"https://umanage-mowatr.s3.amazonaws.com/" + recipe.picture } alt="recipe" /></div>
						</div>
					</div>
					<div className="details col-md-6">
						<h3 className="product-title">{recipe.name}</h3>
						<div className="rating">
                            <div className="stars">
                                <span className="fa fa-star checked"></span>
                                <span className="fa fa-star checked"></span>
                                <span className="fa fa-star checked"></span>
                                <span className="fa fa-star"></span>
                                <span className="fa fa-star"></span>
                            </div>
						<span className="review-no">{recipe.rating}</span>
					    </div>
						<p className="product-description">{ recipe.recipe }</p>
						<h4 className="price">submitted by: <span>{recipe.submitted_by}</span></h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        )
    }
}
export default connect(mapStateToProps)(RecipeView)