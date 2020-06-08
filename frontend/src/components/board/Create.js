import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.js';
import  MainContainer  from './../layout/MainContainer';
import {FormCard} from './../layout/FormCard';
import { BoardForm } from './forms/BoardForm';


const TITLE="Create Board";

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
            manufacturers : [],
            values: [],
            loading: false,
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            images : [],
            headers : {},
            board : {}
        }
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            const headers = { headers: { 
                Authorization: `Bearer ${this.props.session.credentials.accessToken}`,
                'content-type': 'multipart/form-data'
            }};
            
            axios.get(apiConfig.host + apiConfig.port + `/api/manufacturer`, this.props.session.headers)
                .then(data => this.setState({manufacturers : data.data}))
                .catch(error=>this.setState({ submitSuccess: false, submitFail: true, errorMessage : error.response.data.message }));
            axios.get(apiConfig.host + apiConfig.port + `/api/board`, this.props.session.headers)
                .then(data => this.setState({models : data.data}))
                .catch(error=>this.setState({ submitSuccess: false, submitFail: true, errorMessage : error.response.data.message }));
        } else {
                this.props.history.push('/');
        }
    }
    
    processFormSubmission = (e)=> {
        e.preventDefault();
        this.setState({ loading: true });
        const formData = new FormData();
        formData.append('model' , this.state.model);
        formData.append('submitted_by' , this.props.session.user.userName);
        this.state.images.forEach((file, i) => {
            formData.append('photo', file)
          })
        this.setState({ submitSuccess: true, values: [...this.state.values, formData], loading: false });
        if (this.props.session.isLoggedIn && this.props.session.isAdmin) {
            axios.post(apiConfig.host + apiConfig.port + `/api/board`, formData, this.props.session.headers)
            .then(data => [
                setTimeout(() => {
                    this.props.history.push('/board');
                }, 1500)
            ])
            .catch(
                error=>{
                    this.setState({ submitSuccess: false, submitFail: true, errorMessage : error.response.data.message });
                }
            );
        }
    }


ß




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
    
    returnToIndex = e =>
      {
        this.props.history.push('/board');
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
                        <BoardForm 
                        board={this.state.board} 
                        handleInputChanges={this.handleInputChanges} 
                        processFormSubmission={this.processFormSubmission} 
                        loading={loading} 
 
 >
                        </BoardForm>
                    </div>
                </FormCard>
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps)(Create)
