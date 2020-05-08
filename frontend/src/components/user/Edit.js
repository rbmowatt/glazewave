import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.json';

const mapStateToProps = state => {
    return { session: state.session }
  }

class EditUser extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.match.params.id,
            user: {},
            values: [],
            loading: false,
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            headers : {}
        }
    }

    componentDidMount() {
        if (this.props.session.isLoggedIn) {
            const headers = { headers: { Authorization: `Bearer ${this.props.session.credentials.accessToken}`}};
            this.setState({headers});
            axios.get(apiConfig.host + ':' + apiConfig.port + `/user/${this.state.id}`, headers).then(data => {
                this.setState({ user: data.data });
            })
            .catch(error=>console.log(error));
        }
    }

    processFormSubmission = async (e) => {
        e.preventDefault();
        this.setState({ loading: true });
        axios.put(apiConfig.host + ':' + apiConfig.port + `/user/${this.state.id}`, this.state.values, this.state.headers).then(data => {
            this.setState({ submitSuccess: true, loading: false })
            setTimeout(() => {
                this.props.history.push('/user');
            }, 1500)
        })
        .catch(
            error=>{
                this.setState({ submitSuccess: false, submitFail: true, errorMessage : error.response.data.message });
                console.log(error);
            }
        );
    }


    setValues = (values) => {
        this.setState({ values: { ...this.state.values, ...values } });
    }

    handleInputChanges = (e) => {
        e.preventDefault();
        this.setValues({ [e.currentTarget.id]: e.currentTarget.value })
    }

    render() {
        const { submitSuccess, loading, submitFail, errorMessage  } = this.state;
        return (
            <div className="App">
                {this.state.user &&
                    <div>
                        < h1 > User List Management App</h1>
                        <div>
                            <div className={"col-md-12 form-wrapper"}>
                                <h2> Edit user </h2>

                                {submitSuccess && (
                                    <div className="alert alert-info" role="alert">
                                        user's details has been edited successfully </div>
                                )}

                                {submitFail && (
                                    <div className="alert alert-info" role="alert">
                                        { errorMessage }
                                    </div>
                                    )}

                                <form id={"create-post-form"} onSubmit={this.processFormSubmission} noValidate={true}>
                                <div className="form-group col-md-12">
                                        <label htmlFor="Username"> User Name </label>
                                        <input type="text" id="Username" defaultValue={this.state.user.Username} onChange={(e) => this.handleInputChanges(e)} name="Username" className="form-control" placeholder="Enter user's first name" />
                                    </div>
                                    <div className="form-group col-md-12">
                                        <label htmlFor="name"> Name </label>
                                        <input type="text" id="name" defaultValue={this.state.user.name} onChange={(e) => this.handleInputChanges(e)} name="name" className="form-control" placeholder="Enter user's first name" />
                                    </div>
                                    <div className="form-group col-md-12">
                                        <label htmlFor="email"> Email </label>
                                        <input type="email" id="email" defaultValue={this.state.user.email} onChange={(e) => this.handleInputChanges(e)} name="email" className="form-control" placeholder="Enter user's email address" />
                                    </div>

                                    <div className="form-group col-md-12">
                                        <label htmlFor="phone"> Phone </label>
                                        <input type="text" id="phone_number" defaultValue={this.state.user.phone} onChange={(e) => this.handleInputChanges(e)} name="phone_number" className="form-control" placeholder="Enter user's phone number" />
                                    </div>

                                    <div className="form-group col-md-4 pull-right">
                                        <button className="btn btn-success" type="submit">
                                            Edit user </button>
                                        {loading &&
                                            <span className="fa fa-circle-o-notch fa-spin" />
                                        }
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    }
}

export default connect(mapStateToProps)(EditUser)
