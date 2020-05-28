import * as React from 'react';
import { connect } from 'react-redux';
import {FormCard} from './../layout/FormCard';
import { MainContainer } from './../layout/MainContainer';
import SessionForm  from './SessionForm';
import SessionRequests from './../../requests/SessionRequests';
import UserBoardRequests from './../../requests/UserBoardRequests';
import ImageUpload from './../layout/ImageUpload';

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

    processFormSubmission = (e)=> {
        console.log('hit proccessFormSbmission')
        e.preventDefault();
        const formData = SessionRequests.createFormRequest({
            'is_public': this.state.is_public,
            'rating' : this.state.rating,
            'title' : this.state.name,
            'session': this.state.notes, 
            'user_id' : this.props.session.user.id
        });
        this.state.images.forEach((file, i) => {
            formData.append('photo', file)
          })
        this.setState({ submitSuccess: true, values: [...this.state.values, formData], loading: false });
        if (this.props.session.isLoggedIn ) {
            this.props.createSession(new SessionRequests(this.props.session), formData);
        }
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
                        <SessionForm session={this.state.session} handleInputChanges={this.handleInputChanges} processFormSubmission={this.processFormSubmission} loading={loading}  boards={this.props.boards}>
                            <ImageUpload onImageUploaded={this.onImageUploaded} />
                        </SessionForm>
                    </div>
                </FormCard>
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps)(Create)
