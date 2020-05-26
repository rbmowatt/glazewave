import * as React from 'react';
import { connect } from 'react-redux';
import {FormCard} from './../layout/FormCard';
import { MainContainer } from './../layout/MainContainer';
import SessionForm  from './SessionForm';
import Buttons from './../helpers/image/Buttons'
import Images from './../helpers/image/Images'
import SessionRequests from './../../requests/SessionRequests';
import UserBoardRequests from './../../requests/UserBoardRequests';
import Spinner from './../helpers/image/Spinner';
//import ReactDOM from "react-dom";
import Modal from './../layout/Modal';

const mapStateToProps = state => {
    return { session: state.session, boards:state.user_boards }
  }
  const TITLE = 'Create A Session';

class Create extends React.Component{
    constructor(props ) {
        super(props);
        this.state = {
            rating: 5, is_public : 0, name: '', 
            session: '',
            values: [],
            loading: false,
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            images : [],
            headers : {},
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
       // this.userBoardRequest.get({ user_id : this.props.session.user.id}).then(data=>{
         //   this.setState({ boards : data.data }); 
        //})
    }
    
    processFormSubmission = (e)=> {
        e.preventDefault();
        this.setState({ loading: true });
        const formData = new FormData();
        formData.append('is_public', this.state.is_public);
        formData.append('rating' , this.state.rating);
        formData.append('title' , this.state.name);
        formData.append( 'session', this.state.notes);
        formData.append('user_id' , this.props.session.user.id);
        this.state.images.forEach((file, i) => {
            formData.append('photo', file)
          })
        this.setState({ submitSuccess: true, values: [...this.state.values, formData], loading: false });
        if (this.props.session.isLoggedIn && this.props.session.isAdmin) {
            this.sessionRequest.create(formData)
            .then(data => [
                setTimeout(() => {
                    this.props.history.push('/session');
                }, 1500)
            ])
            .catch(
                error=>{
                    this.setState({ submitSuccess: false, submitFail: true, errorMessage : error.response.data.message });
                }
            );
        }
    }

    handleInputChanges = e => {
        e.preventDefault();
        this.setState({
            [e.currentTarget.name]: e.currentTarget.value,
        })
    }

    onChange = e => {
        const files = Array.from(e.target.files)
        this.setState({ uploading: false , images : files});
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
        const { submitSuccess, submitFail, loading, errorMessage, uploading, images, boards, show } = this.state;
        const content = () => {
            switch(true) {
              case uploading:
                return <Spinner />
              case images.length > 0:
                return <Images images={images} removeImage={this.removeImage} />
              default:
                return <Buttons onChange={this.onChange} />
            }
          }
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
                            {content()}
                        </SessionForm>
                    </div>
                </FormCard>
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps)(Create)
