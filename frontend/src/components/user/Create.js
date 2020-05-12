import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import {FormCard} from './../layout/FormCard';
import {UserForm} from './UserForm';

const TITLE = 'Create User';
const mapStateToProps = state => {
    return { session: state.session }
  }

class CreateUser extends React.Component{
    constructor(props ) {
        super(props);
        this.state = {
            Username: '',
            name: '',
            email: '',
            phone_number: '',
            values: [],
            loading: false,
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            headers : {}
        }
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            const headers = { headers: { Authorization: `Bearer ${this.props.session.credentials.accessToken}`}};
            this.setState({headers});
        }
    }

    processFormSubmission = (e)=> {
        e.preventDefault();
        this.setState({ loading: true });

        const formData = {
            Username : this.state.Username,
            name: this.state.name,
            email: this.state.email,
            phone_number: this.state.phone_number,
        }

        this.setState({ submitSuccess: true, values: [...this.state.values, formData], loading: false });

        if (this.props.session.isLoggedIn) {
            axios.post(apiConfig.host + apiConfig.port + `/api/user`, formData, this.state.headers).then(data => [
            setTimeout(() => {
                this.props.history.push('/user');
            }, 1500)
            ])
            .catch(
                error=>{
                    this.setState({ submitSuccess: false, submitFail: true, errorMessage : error.response.data.message });

                }
            );
        }
    }

    handleInputChanges = (e) => {
        e.preventDefault();
        this.setState({
            [e.currentTarget.name]: e.currentTarget.value,
        })
    }

    returnToIndex = e =>
    {
      this.props.history.push('/user');
    }

    render() {
        const { submitSuccess, submitFail, loading, errorMessage } = this.state;
        return (
            <MainContainer>
                <FormCard returnToIndex={this.returnToIndex}>
                    <div className="col-md-12 ">
                        <h2>{TITLE}</h2>
                        {!submitSuccess && (
                            <div className="alert alert-info" role="alert">
                                Fill the form below to create a new post
                        </div>
                        )}

                        {submitSuccess && (
                            <div className="alert alert-info" role="alert">
                                The form was successfully submitted!
                                </div>
                        )}

                        {submitFail && (
                            <div className="alert alert-info" role="alert">
                                { errorMessage }
                                </div>
                        )}
                        <UserForm user={this.state.user} handleInputChanges={this.handleInputChanges} loading={loading} processFormSubmission={this.processFormSubmission} />
                    </div>
                </FormCard>
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps)(CreateUser)
