import * as React from 'react';
import { connect } from 'react-redux'
import Spinner from './../helpers/image/Spinner'
import Images from './../helpers/image/Images'
import Buttons from './../helpers/image/Buttons'
import {FormCard} from './../layout/FormCard';
import  UserBoardForm  from './UserBoardForm';
import { withRouter} from 'react-router-dom';

import UserBoardRequests from './../../requests/UserBoardRequests';
import ImageUpload from './../layout/ImageUpload';


const TITLE="Create Board";

const mapStateToProps = state => {
    return { session: state.session }
  }

class CreateUserBoard extends React.Component{
    constructor(props ) {
        super(props);
        this.state = {
            values: [],
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            images : [],
            board : {}
        }
        this.userBoardRequest = new UserBoardRequests(this.props.session);
    }

    componentDidMount(){
        if (!this.props.session.isLoggedIn) {
            this.props.history.push('/');
        } 
    }
    
    processFormSubmission = (e)=> {
        e.preventDefault();
        this.setState({ loading: true });
        const formData = new FormData();
        formData.append('name' , this.state.name);
        formData.append('rating' , this.state.rating);
        formData.append('user_id' , this.props.session.user.id);
        this.state.images.forEach((file, i) => {
            formData.append('photo', file)
        })

        this.setState({ submitSuccess: true, values: [...this.state.values, formData], loading: false });
        if (this.props.session.isLoggedIn) {
            this.userBoardRequest.create(formData, {'content-type': 'multipart/form-data'})
            .then(data => [
                setTimeout((e) => {
                    this.props.onSuccess();
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
        this.props.history.push('/board');
      }

    render() {
        const { submitSuccess, submitFail, loading, errorMessage, uploading, images } = this.state;
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
                        <UserBoardForm board={this.state.board} handleInputChanges={this.handleInputChanges} processFormSubmission={this.processFormSubmission} loading={loading} >
                                <ImageUpload onImageUploaded={this.onImageUploaded} />
                        </UserBoardForm>
                    </div>
                </FormCard>
        )
    }
}

export default connect(mapStateToProps)(withRouter(CreateUserBoard));
