import * as React from 'react';
import { connect } from 'react-redux';
import {FormCard} from './../layout/FormCard';
import { MainContainer } from './../layout/MainContainer';
import SessionForm  from './SessionForm';
import SessionRequests from './../../requests/SessionRequests';
import UserBoardRequests from './../../requests/UserBoardRequests';
import ImageUpload from './../layout/ImageUpload';
import { Resolver } from 'dns';

const mapStateToProps = state => {
    return { session: state.session, boards:state.user_boards, user_sessions : state.user_sessions }
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
            rating: 5, is_public : 0, name: '',
            values: [],
            loading: false,
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            images : [],
            boards : [],
            show : false
        }
        this.sessionRequest = new SessionRequests(this.props.session);
        this.userBoardRequest = new UserBoardRequests(this.props.session);
    }

    showModal = () => {
      this.setState({ show: true });
    };
  
    hideModal = () => {
      this.setState({ show: false });
    };
  
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
        const {session, createSession} = this.props;
        const { images } = this.state;
        return new Promise(function(resolve, reject){
            console.log('calojng promise')
            if (session.isLoggedIn ) {
                console.log('clogged in ', serialized)
                const formData = SessionRequests.createFormRequest(serialized);
                images.forEach((file, i) => {
                    formData.append('photo', file)
                })
                console.log('got past images')
                //this.setState({ submitSuccess: true, values: [...this.state.values, formData], loading: false });
                createSession(new SessionRequests(session), formData);
                resolve(formData);
            }else{
                reject('user not logged in ');
            }
        });
    }

    handleInputChanges = e => {
        console.log('handleInputChanges')
        e.preventDefault();
        this.setState({
            [e.currentTarget.name]: e.currentTarget.value,
        })
    }

    onImageUploaded = e => {
        const files = Array.from(e.target.files)
        this.setState({ images : files});
    }
    
    removeImage = id => {
        console.log(this.state.images);
        this.setState({
          images: this.state.images.filter(image => image.public_id !== id)
        })
      }

      returnToIndex = e =>
      {
        this.props.history.push('/user/dashboard');
      }

    render() {
        const { submitSuccess, submitFail, loading, errorMessage} = this.state;
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
                         <div className="col-md-6 ">           
                        <SessionForm session={this.state.session} handleInputChanges={this.handleInputChanges} processFormSubmission={this.processFormSubmission} loading={loading}  boards={this.props.boards}>
                            
                        </SessionForm>
                    </div>
                    <div className="col-md-6 ">
                    <ImageUpload onImageUploaded={this.onImageUploaded} />
                    </div>
                    </div>
                </FormCard>
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps)(Create)
