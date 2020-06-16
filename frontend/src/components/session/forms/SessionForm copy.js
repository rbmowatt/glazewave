import React from 'react';
import Modal from './../../layout/Modal';
import { connect } from 'react-redux';
import CreateUserBoard from  './../../board/CreateUserBoard';
import { Form } from 'react-advanced-form';
import { Input, Select, Textarea, Button } from 'react-advanced-form-addons';
import Location from './../../form/Location';
import rules from './validation-rules'
import messages from './validation-messages'
import ImageUploader from 'react-images-upload';
import moment from 'moment'
import {loadUserBoards, clearUserBoards} from './../../../actions/user_board';
import {refresh} from './../../../lib/utils/cognito'

const mapStateToProps = state => {
    return { session: state.session, boards : state.user_boards, user_sessions : state.user_sessions.data }
  }

  const mapDispachToProps = dispatch => {
    return {
        loadBoards: (session, params) => dispatch(loadUserBoards(session, params)),
        clearBoards : ()=>dispatch(clearUserBoards())
      };
  };

  const relations = {
      user_boards : ['Board']
  }

class SessionForm extends React.Component{
    constructor(props)
    {
        refresh(props.session.user.id)
        super(props);
        this.defaultName = moment().format('MMMM D YYYY, h:mm a');
        this.state = {show:false, pictures : props.pictures, location_id : ''}
    }

    onChange = (propertyName , newValue ) => {
        const data = [];
        data[propertyName] = newValue;
        this.setState({
            ...data
        });
      };

    componentDidMount() {
        if (this.props.session.isLoggedIn) {
            if(!this.props.boards.loaded)
            this.props.loadBoards(this.props.session, {wheres : {user_id : this.props.session.user.id }} );
        }
    }

    componentWillUnmount()
    {
        this.props.clearBoards();
    }

    showModal = () => {
        this.setState({ show: true });
    };

    hideModal = (e = false) => {
        if(e) e.preventDefault();
        this.setState({ show: false });
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        if ((prevProps.boards.data.length !== this.props.boards.data.length)) {
            setTimeout(() => {
                this.hideModal();
            }, 1500)
        }
    }

    render(){ 
        return (
            <div className="col-md-12">
            <Form action={({ serialized, fields, form}) => this.props.processFormSubmission({session : this.props.session, serialized, fields, form})} rules={rules} messages={messages} className="col-md-12 row">
            <div className="col-md-8 ">
           
            <Input name="title" 
                label="Session Name" 
                className="form-control" 
                initialValue={this.defaultName}
                required 
            />
            <Location 
                id="location_id" 
                name="location_id" 
                label="Where You paddling Out?" 
                className="form-control" 
                onChange={this.onChange} 
                value={this.state.location_id} />
     
            <Select name="board_id" label="Which Board Did You Use?" >
                  {this.props.boards.data.map((obj) => {
                        return <option key={obj.id} prop={obj.name} value={obj.id}>{obj.name}</option>
                    })}
            </Select>
            
            <Button type='button' onClick={this.showModal}>Add A Board</Button>
            <Select name="rating" label="What would you rate this Session on a scale of 1-10?" >
                {[...Array(11).keys()].map((value, index) => {
                    if(value === 0) return;
                        return  <option key={index} value={value}>{value}</option>
                })}
            </Select>
            <Select name="is_public" label="Should this Session be Public to ALL logged-in Users?" >
                <option value="0">Private</option>
                <option value="1">Public</option>
            </Select>
            <Textarea name="notes" label="Notes"  />
            {
                this.props.children 
            }
            </div>
            <div className="col-md-4">
            <ImageUploader
                withIcon={false}
                buttonText='Choose images'
                onChange={this.props.onDrop}
                imgExtension={['.jpg', '.gif', '.png', '.gif']}
                maxFileSize={5242880}
                withPreview={true}
            />
            </div>
            <div className="col-md-12">
            <Input type="hidden" name="user_id" value={this.props.session.user.id} />
            <Button type='submit'>  {(this.props.edit) ? ("Edit Session") : ( "Add Session") }</Button>
            </div>
            </Form>
            <Modal show={this.state.show} handleClose={(e) =>this.hideModal(e)}>
                <CreateUserBoard onSuccess={(e) =>this.hideModal(e)} noUpdate={true} />
            </Modal>
            </div>
          
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps)(SessionForm);