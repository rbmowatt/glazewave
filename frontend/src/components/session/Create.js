import React, { useState } from 'react';
import { connect } from 'react-redux';
import {FormCard} from './../layout/FormCard';
import { MainContainer } from './../layout/MainContainer';
import SessionForm  from './forms/SessionForm';
import SessionRequests from './../../requests/SessionRequests';

const mapStateToProps = state => {
    return { session: state.session, boards:state.user_boards, user_sessions : state.user_sessions.data }
  }

  const mapDispachToProps = dispatch => {
    return {
        createSession : (request, data) => dispatch( request.create({label : 'LOAD_USER', data: data , onSuccess : (data)=>{ return {type: "SESSION_CREATED", payload: data}}}))};
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
            this.props.history.push('/');
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.user_sessions.length !== this.props.user_sessions.length) {
            this.setState({ submitSuccess : true })
            setTimeout(() => {
                this.props.history.push('/user/dashboard');
            }, 1500)
        }
    }

    processFormSubmission = ({ serialized, fields, form})=> {
        console.log(serialized, fields, form)
        const {session, createSession} = this.props;
        const { images } = this.state;
        return new Promise(function(resolve, reject){
            if (session.isLoggedIn ) {
                const formData = SessionRequests.createFormRequest(serialized);
                images.forEach((file, i) => {
                    formData.append('photo', file)
                })
                createSession(new SessionRequests(session), formData);
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
        console.log('initial images = ', images)
        return (
            <MainContainer>
                <FormCard returnToIndex={this.returnToIndex}>
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
                        <SessionForm session={this.state.session} processFormSubmission={this.processFormSubmission} loading={loading}  boards={this.props.boards} onDrop={this.onDrop}>
                   
                        </SessionForm>
                        </div>
                    </div>
                </FormCard>
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps)(Create)
