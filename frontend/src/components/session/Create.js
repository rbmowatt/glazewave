import React from 'react';
import { connect } from 'react-redux';
import {FormCard} from './../layout/FormCard';
import SessionForm  from './forms/SessionForm';
import SessionRequests from './../../requests/SessionRequests';
import {createUserSession, UserSessionCreatedCleared } from './../../actions/user_session';

const mapStateToProps = state => {
    return { session: state.session, boards:state.user_boards, user_sessions : state.user_sessions }
  }

  const mapDispachToProps = dispatch => {
    return {
        createSession :  (session, params) => dispatch(createUserSession(session, params)),
        clearCreatedSession : ()=> dispatch( UserSessionCreatedCleared() )
    }
  };
  const TITLE = 'Create A Session';

class Create extends React.Component{

    constructor(props ) {
        super(props);
        this.state = {
            values: [],
            loading: false,
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            images : [],
            show : false,
        }
        this.onDrop = this.onDrop.bind(this);
    }

    onDrop(pictureFiles, pictureDataURLs) {
        this.setState({
            images : this.state.images.concat(pictureFiles)
          });
    }
  
    componentDidMount(){
        if (!this.props.session.isLoggedIn) {
            this.props.onSubmissionComplete()
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

        if(this.props.noUpdate) return;
        if ((prevProps.user_sessions.data.length !== this.props.user_sessions.data.length)
        && this.props.user_sessions.created) {
            this.setState({ submitSuccess : true })
            setTimeout(() => {
                if(this.props.onSubmissionComplete)
                {
                    const id = this.props.user_sessions.created.id;
                    this.props.clearCreatedSession();
                    this.props.onSubmissionComplete(id)
                }else{
                    this.props.history.push('/board');
                }
            }, 1500)
        }
    }

    processFormSubmission = ({ serialized, fields, form})=> {
        const {session, createSession} = this.props;
        const { images } = this.state;
        return new Promise(function(resolve, reject){
            if (session.isLoggedIn ) {
                const formData = SessionRequests.createFormRequest(serialized);
                images.forEach((file, i) => {
                    formData.append('photo', file)
                })
                createSession(session, {data : formData});
                resolve(formData);
            }else{
                reject('user not logged in ');
            }
        });
    }

    returnToIndex = e => {
        this.props.history.push('/user/dashboard');
    }

    render() {
        const { submitSuccess, submitFail, loading, errorMessage, images} = this.state;
        return (
                <FormCard returnToIndex={this.props.close}>
                    <div className="col-md-12 row ">
                        <div className="col-md-12 ">
                            <h2>{TITLE}</h2>
                            {!submitSuccess && (
                            <div className="alert alert-info" role="alert">
                                Fill the form below to create a new session
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
                        </div>
                        <div className="col-md-12">           
                            <SessionForm key="session_form" session={this.state.session} processFormSubmission={this.processFormSubmission} loading={loading}  boards={this.props.boards} onDrop={this.onDrop} />
                        </div>
                    </div>
                </FormCard>
          
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps)(Create)
