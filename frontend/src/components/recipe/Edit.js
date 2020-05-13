import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import {FormCard} from './../layout/FormCard';
import { RecipeForm } from './RecipeForm';

const TITLE = "Edit Recipe";
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
            axios.get(apiConfig.host + apiConfig.port + `/api/recipe/${this.state.id}`, headers).then(data => {
                const recipe = data.data[0];
                this.setState({ recipe});
            })
            .catch(error=>this.props.history.push('/recipe'));
        }
    }

    processFormSubmission = async (e) => {
        e.preventDefault();
        this.setState({ loading: true });
       
        axios.put(apiConfig.host + apiConfig.port + `/api/recipe/${this.state.id}`, this.state.values, this.state.headers).then(data => {
            this.setState({ submitSuccess: true, loading: false })
            setTimeout(() => {
                this.props.history.push('/recipe');
            }, 1500)
        })
        .catch(
            error=>{
                this.setState({ submitSuccess: false, submitFail: true, errorMessage : error.response.data.message });
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

    returnToIndex = e =>
    {
      this.props.history.push('/recipe');
    }


    render() {
        const { submitSuccess, loading, submitFail, errorMessage  } = this.state;
        return (
            <MainContainer>
                <FormCard returnToIndex={this.returnToIndex}>
                    <div className="col-md-12 ">
                        <h2>{ TITLE }</h2>
                        {submitSuccess && (
                            <div className="alert alert-info" role="alert">
                                    Recipe details have been edited successfully </div>
                        )}
                        {submitFail && (
                            <div className="alert alert-info" role="alert">
                                    { errorMessage }
                            </div>
                        )} 
                    </div>
                    <RecipeForm recipe={this.state.recipe} loading={loading}  handleInputChanges={this.handleInputChanges} processFormSubmission={this.processFormSubmission} edit="true" />
                </FormCard>
                }
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps)(EditRecipe)
