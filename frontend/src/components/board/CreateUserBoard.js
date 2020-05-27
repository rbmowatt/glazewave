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

  const mapDispachToProps = dispatch => {
    return {
        createUserBoard : (request, data) => dispatch( request.create({label : 'CREATE_USER_BOARD', data: data , onSuccess : (data)=>{ return {type: "USER_BOARD_CREATED", payload: data}}}))};
  };

class CreateUserBoard extends React.Component{
    constructor(props ) {
        super(props);
        this.state = {
            rating: 5, is_public : 0, name: '',
            values: [],
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            images : [],
            board : {}
        }
    }

    componentDidMount(){
        if (!this.props.session.isLoggedIn) {
            this.props.history.push('/');
        } 
    }
    
    processFormSubmission = (e)=> {
        e.preventDefault();
        this.setState({ loading: true });

        const formData = UserBoardRequests.createFormRequest({
            'rating' : this.state.rating,
            'name' : this.state.name,
            'user_id' : this.props.session.user.id
        });
        this.state.images.forEach((file, i) => {
            formData.append('photo', file)
          })
        this.setState({ submitSuccess: true, values: [...this.state.values, formData], loading: false });
        if (this.props.session.isLoggedIn) {
            this.props.createUserBoard(new UserBoardRequests(this.props.session), formData);
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

export default connect(mapStateToProps, mapDispachToProps)(withRouter(CreateUserBoard));
