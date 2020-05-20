import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.js';
import Spinner from './../helpers/image/Spinner'
import Images from './../helpers/image/Images'
import Buttons from './../helpers/image/Buttons'
import { MainContainer } from './../layout/MainContainer';
import {FormCard} from './../layout/FormCard';
import { SessionForm } from './SessionForm';


const TITLE="Create Session";

const mapStateToProps = state => {
    return { session: state.session }
  }

class Create extends React.Component{
    constructor(props ) {
        super(props);
        this.state = {
            rating: 5,
            is_public : 0,
            name: '',
            submitted_by: '',
            session: '',
            values: [],
            loading: false,
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            images : [],
            headers : {}
        }
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            const headers = { headers: { 
                Authorization: `Bearer ${this.props.session.credentials.accessToken}`,
                'content-type': 'multipart/form-data'
            }};
            this.setState({headers});
        } else {
                this.props.history.push('/');
        }
    }
    
    processFormSubmission = (e)=> {
        e.preventDefault();
        this.setState({ loading: true });
        const formData = new FormData();
        formData.append('is_public', this.state.is_public);
        formData.append('rating' , this.state.rating);
        formData.append('title' , this.state.name);
        //formData.append( 'session', this.state.session);
        formData.append('submitted_by' , this.props.session.user.userName);
        this.state.images.forEach((file, i) => {
            formData.append('photo', file)
          })
        this.setState({ submitSuccess: true, values: [...this.state.values, formData], loading: false });
        if (this.props.session.isLoggedIn && this.props.session.isAdmin) {
            axios.post(apiConfig.host + apiConfig.port + `/api/session`, formData, this.state.headers)
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
        this.props.history.push('/session');
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
                        <SessionForm session={this.state.session} handleInputChanges={this.handleInputChanges} processFormSubmission={this.processFormSubmission} loading={loading} >
                    
                                {content()}
                            
                        </SessionForm>
                    </div>
                </FormCard>
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps)(Create)