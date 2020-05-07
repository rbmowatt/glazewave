import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.json';

const mapStateToProps = state => {
    return { session: state.session }
  }

class EditRecipe extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.match.params.id,
            recipe: {},
            values: [],
            loading: false,
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            headers : {}
        }
    }

    componentDidMount() {
        if (this.props.session.isLoggedIn) {
            const headers = { headers: { Authorization: `Bearer ${this.props.session.credentials.accessToken}`}};
            this.setState({headers});
            axios.get(apiConfig.host + ':' + apiConfig.port + `/recipe/${this.state.id}`, headers).then(data => {
                const recipe = data.data[0];
                this.setState({ recipe});
            })
            .catch(error=>console.log(error));
        }
    }

    processFormSubmission = async (e) => {
        e.preventDefault();
        this.setState({ loading: true });
       
        axios.put(apiConfig.host + ':' + apiConfig.port + `/recipe/${this.state.id}`, this.state.values, this.state.headers).then(data => {
            this.setState({ submitSuccess: true, loading: false })
            setTimeout(() => {
                this.props.history.push('/recipe');
            }, 1500)
        })
        .catch(
            error=>{
                this.setState({ submitSuccess: false, submitFail: true, errorMessage : error.response.data.message });
                console.log(error);
            }
        );
    }

    setValues = (values) => {
        this.setState({ values: { ...this.state.values, ...values } });
    }

    handleInputChanges = (e) => {
        e.preventDefault();
        this.setValues({ [e.currentTarget.id]: e.currentTarget.value })
    }

    render() {
        const { submitSuccess, loading, submitFail, errorMessage  } = this.state;
        return (
            <div className="App">
                {this.state.recipe &&
                    <div>
                        < h1 > Recipe List Management App</h1>
                        <div>
                            <div className={"col-md-12 form-wrapper"}>
                                <h2> Edit recipe </h2>

                                {submitSuccess && (
                                    <div className="alert alert-info" role="alert">
                                        recipe's details has been edited successfully </div>
                                )}

                                {submitFail && (
                                    <div className="alert alert-info" role="alert">
                                        { errorMessage }
                                    </div>
                                    )}

                            <form id={"create-post-form"} onSubmit={this.processFormSubmission} noValidate={true}>
                                <div className="form-group col-md-12">
                                    <label htmlFor="rating"> What would you rate this Recipe on a scale of 1-10?
                                    <select defaultValue={this.state.recipe.rating} onChange={(e) => this.handleInputChanges(e)} id="rating" name="rating" className="form-control">
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                    <option value="6">6</option>
                                    <option value="7">7</option>
                                    <option value="8">8</option>
                                    <option value="9">9</option>
                                    <option value="10">10</option>
                                    </select>
                                    </label>
                                </div>
                                <div className="form-group col-md-12">
                                <label htmlFor="is_public"> Should this Recipe be Public to ALL logged-in Users?
                                    <select defaultValue={this.state.recipe.is_public} onChange={(e) => this.handleInputChanges(e)} id="is_public" name="is_public" className="form-control">
                                    <option value="0">Private</option>
                                    <option value="1">Public</option>
                                    </select>
                                    </label>
                                </div>
                                <div className="form-group col-md-12">
                                    <label htmlFor="first_name"> Name/Title </label>
                                    <input type="text" id="name" defaultValue={this.state.recipe.name} onChange={(e) => this.handleInputChanges(e)} name="name" className="form-control" placeholder="Recipe Title" />
                                </div>
                                <div className="form-group col-md-12">
                                    <label htmlFor="recipe"> Recipe </label>
                                    <textarea id="recipe" defaultValue={this.state.recipe.recipe} onChange={(e) => this.handleInputChanges(e)} name="recipe" className="form-control" placeholder="Enter the Recipe Here!!" />
                                </div>
                                <div className="form-group col-md-4 pull-right">
                                    <button className="btn btn-success" type="submit">
                                        Update Recipe
                                    </button>
                                    {loading &&
                                        <span className="fa fa-circle-o-notch fa-spin" />
                                    }
                                </div>
                            </form>
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    }
}

export default connect(mapStateToProps)(EditRecipe)
