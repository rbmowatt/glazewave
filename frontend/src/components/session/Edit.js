import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import {FormCard} from './../layout/FormCard';
import SessionForm from './SessionForm';
import SessionRequests from './../../requests/SessionRequests';

const TITLE = "Edit Session";
const mapStateToProps = state => {
    return { session: state.session }
  }

class EditSession extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.match.params.id,
            session: {},
            values: [],
            loading: false,
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            headers : {}
        }
        this.sessionRequest = new SessionRequests(this.props.session);
    }

    componentDidMount() {
        if (this.props.session.isLoggedIn) {
            axios.get(apiConfig.host + apiConfig.port + `/api/session/${this.state.id}`, this.props.session.headers).then(data => {
                const session = data.data;
                this.setState({ session});
            })
            .catch(error=>this.props.history.push('/session'));
        }
    }

    processFormSubmission = async (e) => {
        e.preventDefault();
        this.setState({ loading: true });
        this.sessionRequest.update(this.state.id, this.state.values).then(data => {
            this.setState({ submitSuccess: true, loading: false })
            setTimeout(() => {
                this.props.history.push('/session');
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
        this.setValues({ [e.currentTarget.id]: e.currentTarget.value });
        const session = this.state.session;
        session[e.currentTarget.id] = e.currentTarget.value;
        this.setState({session});
    }

    returnToIndex = e =>
    {
        this.props.history.push('/user/dashboard');
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
                                    Session details have been edited successfully </div>
                        )}
                        {submitFail && (
                            <div className="alert alert-info" role="alert">
                                    { errorMessage }
                            </div>
                        )} 
                    </div>
                    <SessionForm session={this.state.session} loading={loading}  handleInputChanges={this.handleInputChanges} processFormSubmission={this.processFormSubmission} edit="true" />
                </FormCard>
                }
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps)(EditSession)
