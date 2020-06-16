import * as React from 'react';
import { connect } from 'react-redux'
import {FormCard} from './../layout/FormCard';
import  UserBoardForm  from './forms/UserBoardForm';
import { withRouter} from 'react-router-dom';
import UserBoardRequests from './../../requests/UserBoardRequests';
import {createUserBoard, UserBoardCreatedCleared} from './../../actions/user_board';



const TITLE="Create Board";

const mapStateToProps = state => {
    return { session: state.session, user_boards : state.user_boards}
  }

  const mapDispachToProps = dispatch => {
    return {
        createUserBoard : (session, params) => dispatch(createUserBoard(session, params)), 
        clearCreatedBoard : ()=>dispatch( UserBoardCreatedCleared())
    };
  };

class CreateUserBoard extends React.Component{
    constructor(props ) {
        super(props);
        this.state = {
            submitSuccess: false,
            submitFail: false,
            errorMessage : null,
            images : []
        }
        this.onDrop = this.onDrop.bind(this);
    }

    onDrop(pictureFiles, pictureDataURLs) {
        this.setState({
            images : this.state.images.concat(pictureFiles)
          });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        
        if(this.props.noUpdate) return;
        if ((prevProps.user_boards.data.length !== this.props.user_boards.data.length)
       && this.props.user_boards.created) {
            this.setState({ submitSuccess : true })
            setTimeout(() => {
                if(this.props.onSubmissionComplete)
                {
                    const id = this.props.user_boards.created.id;
                   this.props.clearCreatedBoard();
                    this.props.onSubmissionComplete(id)
                }else{
                    this.props.history.push('/board');
                }
            }, 1500)
        }
    }
    
    processFormSubmission = ({ serialized, fields, form})=> {
        const {session, createUserBoard} = this.props;
        const { images } = this.state;
        return new Promise(function(resolve, reject){
            if (session.isLoggedIn ) {
                const formData = UserBoardRequests.createFormRequest(serialized);
                images.forEach((file, i) => {
                    formData.append('photo', file)
                })
                createUserBoard(session, { data : formData});
                resolve(formData);
            }else{
                reject('user not logged in ');
            }
        });
    }

    handleInputChanges = e => {
        e.preventDefault();
        this.setState({
            [e.currentTarget.name]: e.currentTarget.value,
        })
    }

    render() {
        const { submitSuccess, submitFail, loading, errorMessage} = this.state;
        return (
                <FormCard returnToIndex={this.props.close}>
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
                        <UserBoardForm board={this.state.board} handleInputChanges={this.handleInputChanges} processFormSubmission={this.processFormSubmission} loading={loading}  onDrop={this.onDrop} />
                    </div>
                </FormCard>
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps)(withRouter(CreateUserBoard));
