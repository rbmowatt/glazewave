import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import {FormCard} from './../layout/FormCard';
import {UserForm} from './UserForm';

const TITLE = 'Edit User';
const mapStateToProps = state => {
    return { session: state.session }
  }

class EditUser extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.match.params.id,
            user: {},
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
            axios.get(apiConfig.host + apiConfig.port + `/api/user/${this.state.id}`, headers).then(data => {
                this.setState({ user: data.data });
            })
            .catch(error=>this.props.history.push('/user'));
        }
    }

    processFormSubmission = async (e) => {
        e.preventDefault();
        this.setState({ loading: true });
        axios.put(apiConfig.host + apiConfig.port + `/api/user/${this.state.id}`, this.state.values, this.state.headers).then(data => {
            this.setState({ submitSuccess: true, loading: false })
            setTimeout(() => {
                this.props.history.push('/user');
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
      this.props.history.push('/user');
    }

    render() {
        const { submitSuccess, loading, submitFail, errorMessage} = this.state;
        return (
           <MainContainer>
                {this.state.user &&
                <FormCard returnToIndex={this.returnToIndex}>
                    <div className="col-md-12 ">
                        <h2>{TITLE}</h2>
                        {submitSuccess && (
                            <div className="alert alert-info" role="alert">
                                            user's details has been edited successfully 
                            </div>
                        )}
                        {submitFail && (
                            <div className="alert alert-info" role="alert">
                                { errorMessage }
                            </div>
                        )}
                    <UserForm user={this.state.user} handleInputChanges={this.handleInputChanges} loading={loading} processFormSubmission={this.processFormSubmission} edit="true"/>
                    </div>
                </FormCard>
                }
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps)(EditUser)
