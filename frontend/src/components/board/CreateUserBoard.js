import * as React from 'react';
import { connect } from 'react-redux'
import {FormCard} from './../layout/FormCard';
import  UserBoardForm  from './forms/UserBoardForm';
import { withRouter} from 'react-router-dom';
import UserBoardRequests from './../../requests/UserBoardRequests';
import {loadUserBoards} from './../../actions/user_board';



const TITLE="Create Board";

const mapStateToProps = state => {
    return { session: state.session, user_boards : state.user_boards }
  }

  const mapDispachToProps = dispatch => {
    return {
        createUserBoard : (request, data) => dispatch( request.create({label : 'CREATE_USER_BOARD', data: data , onSuccess : (data)=>{ return {type: "USER_BOARD_CREATED", payload: data}}})),
        loadBoards: (session, params) => dispatch(loadUserBoards(session, params)),
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
        if (prevProps.user_boards.length !== this.props.user_boards.length) {
            this.setState({ submitSuccess : true })
            this.props.loadBoards(this.props.session, {wheres : {user_id : this.props.session.user.id }, withs : ['Board.Manufacturer', 'UserBoardImage']});
            setTimeout(() => {
                this.props.history.push('/board');
            }, 1500)
        }
    }

    componentDidMount(){
        if (!this.props.session.isLoggedIn) {
            this.props.history.push('/');
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
                createUserBoard(new UserBoardRequests(session), formData);
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

    returnToIndex = e =>
    {
        this.props.history.push('/board');
    }

    render() {
        const { submitSuccess, submitFail, loading, errorMessage} = this.state;
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
                        <UserBoardForm board={this.state.board} handleInputChanges={this.handleInputChanges} processFormSubmission={this.processFormSubmission} loading={loading}  onDrop={this.onDrop} />
                    </div>
                </FormCard>
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps)(withRouter(CreateUserBoard));
