import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.js';
import Spinner from './../helpers/image/Spinner'
import Images from './../helpers/image/Images'
import Buttons from './../helpers/image/Buttons'

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
            recipe: '',
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
        }
    }

    processFormSubmission = (e)=> {
        e.preventDefault();
        this.setState({ loading: true });

  
        const formData = new FormData();
        formData.append('is_public', this.state.is_public);
        formData.append('rating' , this.state.rating);
        formData.append('name' , this.state.name);
        formData.append( 'recipe', this.state.recipe);
        formData.append('submitted_by' , this.props.session.user.userName);
  
        this.state.images.forEach((file, i) => {
            formData.append('photo', file)
          })


        this.setState({ submitSuccess: true, values: [...this.state.values, formData], loading: false });

        if (this.props.session.isLoggedIn) {
            console.log(formData);
            axios.post(apiConfig.host + ':' + apiConfig.port + `/recipe`, formData, this.state.headers)
            .then(data => [
                setTimeout(() => {
                    this.props.history.push('/recipe');
                }, 1500)
            ])
            .catch(
                error=>{
                    this.setState({ submitSuccess: false, submitFail: true, errorMessage : error.response.data.message });
                    console.log(error);
                }
            );
        }
    }

    handleInputChanges = e => {
        console.log(this.state);
        e.preventDefault();
        this.setState({
            [e.currentTarget.name]: e.currentTarget.value,
        })
        console.log(this.state);
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
            <div className="main-container">
                <div className="container">
                    <div className="row">
                        <div className="card mx-auto">
                            <div className="card-text">
                               
                                    <div className="col-md-12 ">
                                        <h2> Create Recipe </h2>
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
                                            <form className="row" id={"create-post-form"} onSubmit={this.processFormSubmission} noValidate={false} >
                                                <div className="form-group col-md-12">
                                                    <label htmlFor="rating"> What would you rate this Recipe on a scale of 1-10?
                                                    <select value={this.state.rating} onChange={(e) => this.handleInputChanges(e)} id="rating" name="rating" className="form-control">
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                    <option value="5">5</option>
                                                    <option value="6">6</option>
                                                    <option value="7">7</option>
                                                    <option value="8">8</option>
                                                    <option value="9">9</option>
                                                    <option value="10">10</option>
                                                    </select>
                                                    </label>
                                                </div>
                                                <div className="form-group col-md-12">
                                                <label htmlFor="is_public"> Should this Recipe be Public to ALL logged-in Users?
                                                    <select value={this.state.is_public} onChange={(e) => this.handleInputChanges(e)} id="is_public" name="is_public" className="form-control">
                                                    <option value="0">Private</option>
                                                    <option value="1">Public</option>
                                                    </select>
                                                    </label>
                                                </div>
                                                <div className="form-group col-md-12">
                                                    <label htmlFor="first_name"> Name/Title </label>
                                                    <input type="text" id="name" onChange={(e) => this.handleInputChanges(e)} name="name" className="form-control" placeholder="Recipe Title" required />
                                                </div>
                                                <div className="form-group col-md-12">
                                                    <label htmlFor="recipe"> Recipe </label>
                                                    <textarea value={this.state.recipe} onChange={(e) => this.handleInputChanges(e)} name="recipe" className="form-control" placeholder="Enter the Recipe Here!!"  required />
                                                </div>
                                                <div>
                                                    <div className='buttons form-group col-md-12'>
                                                    {content()}
                                                    </div>
                                                </div>
                                                <div className="form-group col-md-4 pull-right">
                                                    <button className="btn btn-success" type="submit">
                                                        Create Recipe
                                                    </button>
                                                    {loading &&
                                                        <span className="fa fa-circle-o-notch fa-spin" />
                                                    }
                                                </div>
                                            </form>
                                    </div>
                                
                                
                            </div>
                         </div>
                    
                    </div>
                </div>
            </div>
        )
    }
}

export default connect(mapStateToProps)(Create)
