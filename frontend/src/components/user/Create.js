import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.js';

const mapStateToProps = state => {
    return { session: state.session }
  }

class Create extends React.Component{
    constructor(props ) {
        super(props);
        this.state = {
            userName: '',
            name: '',
            email: '',
            phone_number: '',
            values: [],
            loading: false,
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            headers : {}
        }
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            const headers = { headers: { Authorization: `Bearer ${this.props.session.credentials.accessToken}`}};
            this.setState({headers});
        }
    }

    processFormSubmission = (e)=> {
        e.preventDefault();
        this.setState({ loading: true });

        const formData = {
            userName : this.state.userName,
            name: this.state.name,
            email: this.state.email,
            phone_number: this.state.phone_number,
        }

        this.setState({ submitSuccess: true, values: [...this.state.values, formData], loading: false });

        if (this.props.session.isLoggedIn) {
            axios.post(apiConfig.host + apiConfig.port + `/api/user`, formData, this.state.headers).then(data => [
            setTimeout(() => {
                this.props.history.push('/user');
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

    handleInputChanges = (e) => {
        e.preventDefault();
        this.setState({
            [e.currentTarget.name]: e.currentTarget.value,
        })
    }

    render() {
        const { submitSuccess, submitFail, loading, errorMessage } = this.state;
        return (
            <header className="background rgba-black-strong">
               <div className="main-container">
            <div className="container">
                <div className="row">
                    <div className="card mx-auto">
                        <div className="card-text">
                            <div className="row">
                                <div className="col-md-12 ">
                    <h2> Create User </h2>
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

                    <form className="row" id={"create-post-form"} onSubmit={this.processFormSubmission} noValidate={true}>
                        <div className="form-group col-md-12">
                            <label htmlFor="first_name"> User Name </label>
                            <input type="text" id="userName" onChange={(e) => this.handleInputChanges(e)} name="userName" className="form-control" placeholder="Enter unique user name" required />
                        </div>
                         <div className="form-group col-md-12">
                            <label htmlFor="first_name"> Name </label>
                            <input type="text" id="name" onChange={(e) => this.handleInputChanges(e)} name="name" className="form-control" placeholder="Enter full name" required />
                        </div>
                        <div className="form-group col-md-12">
                            <label htmlFor="email"> Email </label>
                            <input type="email" id="email" onChange={(e) => this.handleInputChanges(e)} name="email" className="form-control" placeholder="Enter customer's email address" required />
                        </div>
                        <div className="form-group col-md-12">
                            <label htmlFor="phone_number"> Phone Number </label>
                            <input type="text" id="phone_number" onChange={(e) => this.handleInputChanges(e)} name="phone_number" className="form-control" placeholder="format = +1[phone]" required  />
                        </div>
                        <div className="form-group col-md-4 pull-right">
                            <button className="btn btn-success" type="submit">
                                Create User
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
            </div>
            </header>
        )
    }
}

export default connect(mapStateToProps)(Create)
