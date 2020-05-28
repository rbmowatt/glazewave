import React from 'react';
import Modal from './../layout/Modal';
import { connect } from 'react-redux';
import CreateUserBoard from  './../board/CreateUserBoard';
import UserBoardRequests from './../../requests/UserBoardRequests';
import { Form } from 'react-advanced-form';
import Input from './../form/Input';
import { Select, Textarea, Button } from 'react-advanced-form-addons';

const mapStateToProps = state => {
    return { session: state.session, boards : state.user_boards, user_sessions : state.user_sessions }
  }

  const mapDispachToProps = dispatch => {
    return {
        loadBoards: (request, session) => dispatch( request.get({label : 'LOAD_USER_BAORDS',  wheres : {user_id : session.user.id }, withs : ['Board'], onSuccess : (data)=>{ return {type: "SET_USER_BOARDS", payload: data}}})),
        };
  };

class SessionForm extends React.Component{
    constructor(props)
    {
        super(props);
        this.state = {show:false}
    }

    componentDidMount() {
        if (this.props.session.isLoggedIn) {
            if(!this.props.boards.length)
            this.props.loadBoards(new UserBoardRequests(this.props.session), this.props.session );
        }
    }

    showModal = () => {
        this.setState({ show: true });
    };

    hideModal = (e = false) => {
        if(e) e.preventDefault();
        this.setState({ show: false });
    };


    componentDidUpdate(prevProps, prevState, snapshot) {
        if ((prevProps.boards.length !== this.props.boards.length)) {
            setTimeout(() => {
                this.hideModal();
            }, 1500)
        }
    }

    render(){ 
        return (
            <div>
            <Form onSubmit={this.props.processFormSubmission} >
            <Input name="name" label="Session Name" required />
            <Select name="board_id" label="Which Board Did You Use?" required>
                  {this.props.boards.map((obj) => {
                        return <option key={obj.id} prop={obj.name} value={obj.id}>{obj.name}</option>
                    })}
            </Select>
            <Button type='button' onClick={this.showModal}>Add A Board</Button>
            <Select name="rating" label="What would you rate this Session on a scale of 1-10?" required>
                {[...Array(11).keys()].map((value, index) => {
                    if(value === 0) return;
                        return  <option key={index} value={value}>{value}</option>
                })}
            </Select>
            <Select name="is_public" label="Should this Session be Public to ALL logged-in Users?" required>
                <option value="0">Private</option>
                <option value="1">Public</option>
            </Select>
            <Textarea name="notes" label="Notes" required />
            {
                this.props.children 
            }
            <Button type='submit'>  {(this.props.edit) ? ("Edit Session") : ( "Add Session") }</Button>
            </Form>
            <Modal show={this.state.show} handleClose={(e) =>this.hideModal(e)}>
                <CreateUserBoard onSuccess={(e) =>this.hideModal(e)} />
            </Modal>
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps)(SessionForm);