import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import {FormCard} from './../layout/FormCard';
import { LocationForm } from './LocationForm';

const TITLE = "Edit Location";
const mapStateToProps = state => {
    return { session: state.session }
  }

class EditLocation extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.match.params.id,
            session: {},
            location : {},
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
            
            
            axios.get(apiConfig.host + apiConfig.port + `/api/location/${this.state.id}`, this.props.session.headers).then(data => {
                const location = data.data;
                this.setState({ location });
            })
            .catch(error=>this.props.history.push('/location'));
        }
    }

    processFormSubmission = async (e) => {
        e.preventDefault();
        this.setState({ loading: true });
       
        axios.put(apiConfig.host + apiConfig.port + `/api/location/${this.state.id}`, this.state.values, this.props.session.headers).then(data => {
            this.setState({ submitSuccess: true, loading: false })
            setTimeout(() => {
                this.props.history.push('/location');
            }, 1500)
        })
        .catch(
            error=>{
                this.setState({ submitSuccess: false, submitFail: true, errorMessage : error.response.data.message });
            }
        );
    }

    setValues = (values) => {
        this.setState({ values: { ...this.state.values, ...values } });
    }

    handleInputChanges = (e) => {
        e.preventDefault();
        this.setValues({ [e.currentTarget.id]: e.currentTarget.value });
        const session = this.state.session;
        session[e.currentTarget.id] = e.currentTarget.value;
        this.setState({session});
    }

    returnToIndex = e =>
    {
      this.props.history.push('/location');
    }


    render() {
        const { submitSuccess, loading, submitFail, errorMessage  } = this.state;
        return (
            <MainContainer>
                <FormCard returnToIndex={this.returnToIndex}>
                    <div className="col-md-12 ">
                        <h2>{ TITLE }</h2>
                        {submitSuccess && (
                            <div className="alert alert-info" role="alert">
                                    Location details have been edited successfully </div>
                        )}
                        {submitFail && (
                            <div className="alert alert-info" role="alert">
                                    { errorMessage }
                            </div>
                        )} 
                    </div>
                    <LocationForm location={this.state.location} loading={loading}  handleInputChanges={this.handleInputChanges} processFormSubmission={this.processFormSubmission} edit="true" />
                </FormCard>
                }
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps)(EditLocation)
