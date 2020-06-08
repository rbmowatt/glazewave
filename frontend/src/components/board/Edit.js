import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.js';
import  MainContainer  from './../layout/MainContainer';
import {FormCard} from './../layout/FormCard';
import { BoardForm } from './forms/BoardForm';

const TITLE = "Edit Board";
const mapStateToProps = state => {
    return { session: state.session }
  }

class EditBoard extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.match.params.id,
            session: {},
            board : {},
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
            
            
            axios.get(apiConfig.host + apiConfig.port + `/api/board/${this.state.id}`, this.props.session.headers).then(data => {
                const board = data.data;
                this.setState({ board });
            })
            .catch(error=>this.props.history.push('/board'));
        }
    }

    processFormSubmission = async (e) => {
        e.preventDefault();
        this.setState({ loading: true });
       
        axios.put(apiConfig.host + apiConfig.port + `/api/board/${this.state.id}`, this.state.values, this.props.session.headers).then(data => {
            this.setState({ submitSuccess: true, loading: false })
            setTimeout(() => {
                this.props.history.push('/board');
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
      this.props.history.push('/board');
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
                                    Board details have been edited successfully </div>
                        )}
                        {submitFail && (
                            <div className="alert alert-info" role="alert">
                                    { errorMessage }
                            </div>
                        )} 
                    </div>
                    <BoardForm board={this.state.board} loading={loading}  handleInputChanges={this.handleInputChanges} processFormSubmission={this.processFormSubmission} edit="true" />
                </FormCard>
                }
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps)(EditBoard)
