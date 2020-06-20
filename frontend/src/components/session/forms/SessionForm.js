import React from 'react';
import { connect } from 'react-redux';
import { Form } from 'react-advanced-form';
import { Input, Button } from 'react-advanced-form-addons';
import Location from './../../form/Location';
import rules from './validation-rules'
import messages from './validation-messages'
import moment from 'moment'
import {loadUserBoards, clearUserBoards} from './../../../actions/user_board';
import {refresh} from './../../../lib/utils/cognito'

const mapStateToProps = state => {
    return { session: state.session, boards : state.user_boards, user_sessions : state.user_sessions }
  }

  const mapDispachToProps = dispatch => {
    return {
        loadBoards: (session, params) => dispatch(loadUserBoards(session, params)),
        clearBoards : ()=>dispatch(clearUserBoards())
      };
  };

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
            </div>
            <div className="col-md-12">
            <Input type="hidden" name="user_id" value={this.props.session.user.id} />
            <Button type='submit'>  {(this.props.edit) ? ("Edit Session") : ( "Add Session") }</Button>
            </div>
            </Form>

            </div>
          
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps)(SessionForm);