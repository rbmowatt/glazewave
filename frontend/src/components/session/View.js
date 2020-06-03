import './Session.css'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {FormCard} from './../layout/FormCard';
import { MainContainer } from './../layout/MainContainer';
import StarBar from './../layout/StarBar';
import SessionRequests from './../../requests/SessionRequests';
import UserBoardRequests from './../../requests/UserBoardRequests'
import ImageGallery from 'react-image-gallery';
import moment from 'moment'
import { Form } from 'react-advanced-form';
import { RIEToggle, RIEInput, RIETextArea, RIENumber, RIETags, RIESelect } from '@attently/riek'
import _ from 'lodash'
import {UserBoardsLoaded} from './../../actions/user_board';
import Location from './../form/Location';
import InlineEdit, { InputType } from 'riec'

const mapStateToProps = state => {
    return { session: state.session, current_session : state.user_sessions.selected, boards : state.user_boards, session_images : state.session_images }
  }

  const withs = {
    session : ['Location', 'UserBoard']
  }

  const mapDispachToProps = dispatch => {
    return {
      loadSession: (request, props) => dispatch( request.getOne({id : props.match.params.id,  withs : withs.session , onSuccess : (data)=>{ return { type: "SET_USER_SESSION", payload: data}}})),
      loadSessionImages: (request, props) => dispatch( request.getImages({wheres : {session_id : props.match.params.id }, onSuccess : (data)=>{ return { type: "SET_SESSION_IMAGES", payload: data}}})),
      clearSession : ()=>dispatch({ type: "CLEAR_USER_SESSION"}),
      editSession : (request, props, data)=>dispatch( request.update({ id : props.match.params.id, data: data, onSuccess : (data)=>{ return { type: "USER_SESSION_UPDATED", payload: data}}})),
      loadBoards: (request, session) => dispatch( request.get({wheres : {user_id : session.user.id },  onSuccess : (data)=>{ return UserBoardsLoaded(data)}})),
    };
  };

class SessionView extends Component {

    
    constructor(props)
    {
        super(props)
        this.props.loadBoards(new UserBoardRequests(props.session), props.session );
        this.state = { 
            title : '', notes : '', board_id : 0, boards : [], location_id : '', rating : 0,
            select: {id : 0, name : 'No Board Selected'},
            selectOptions: [
            ]
        };
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.props.loadSession(new SessionRequests(this.props.session), this.props);
            this.props.loadSessionImages(new SessionRequests(this.props.session), this.props );
           
        }
       else{
            this.props.history.push('/session');
       }
    }

    componentWillUpdate()
    {
        if(this.props.boards.length && !this.state.selectOptions.length)
        {
            console.log('cwu');
            const b = [];
            let select = this.state.select
            this.props.boards.map((obj) => {
                if(obj.id === this.props.current_session.board_id) select = { id : obj.id , name : obj.name}
                return b.push({ id : obj.id , name : obj.name}) 
            })
    
            this.setState({selectOptions: b, select : select})
        }
    }

    componentWillUnmount(){
        this.props.clearSession();
    }

    returnToIndex = e =>
    {
      this.props.history.push('/user/dashboard');
    }

    submitUpdate = ( data ) =>
    {
        this.props.editSession(new SessionRequests(this.props.session), this.props , data);
        this.setState( data );
    }

    onChange = (e) =>
    {
        this.submitUpdate(e);
    }

    onLocationChange = (propertyName , newValue ) => {
        const data = [];
        data[propertyName] = newValue;
        this.submitUpdate({ ...data});
      };

    onLocationBlur = (e, a, d) =>
    {
        console.log('blur', e, a, d)
    }

    onBoardChange = (id) =>
    {
        this.submitUpdate({ board_id : id});
        const idInt = parseInt(id);
        this.state.selectOptions.map((obj) => {
            if(obj.id === idInt ) this.setState({select : obj});
        })
    }


    render() {
        const session = this.props.current_session;
        return (
            <MainContainer>
                <FormCard returnToIndex={this.returnToIndex}>
                    <Form>
                        <div className="container">
                            <div className="wrapper row">
                                <div className="details col-md-12">
                                    <h3 className="session-title"> 
                                    <RIEInput
                                        required={false}
                                        value={this.state.title}
                                        defaultValue={session.title}
                                        change={this.onChange}
                                        propName='title'
                                    
                                        /></h3>
                                    </div>
                                <div className="preview col-md-7">
                                    <ImageGallery items={this.props.session_images} />
                                </div>
                                <div className="details col-md-5">
                                <h5 className="submitted-by">
                                    <Location 
                                        id="location_id" 
                                        name="location_id" 
                                        className="form-control" 
                                        onChange={this.onLocationChange} 
                                        onBlur={this.onLocationBlur}
                                        value={session.location_id} 
                                        placeholder={(session.Location) ? session.Location.formatted_address : 'No Location Specified'} 
                                    />
                                </h5>
                                <div className="rating">
                                    <StarBar stars={this.state.rating} onClick={this.onChange} />
                                </div>
                                <h5 className="submitted-by">Date: <span>{moment(session.createdAt).format('MMMM D YYYY')}</span></h5>
                                <h5 className="submitted-by">Time: <span>{moment(session.createdAt).format('h:mm a')}</span></h5>
                                <h5 className="submitted-by">Board: <span>
                                    <InlineEdit
                                        type={InputType.Select}
                                        value={this.state.select.name}
                                        onChange={this.onBoardChange}
                                        options={this.state.selectOptions}
                                        valueKey="id"
                                        labelKey="name"
                                        />                            
                                    </span>
                                </h5>
                                <h5 className="review-no">Notes:
                                    <RIETextArea
                                        value={this.state.notes}
                                        defaultValue={session.notes}
                                        change={this.onChange}
                                        propName='notes'
                                        validate={_.isString} 
                                        />
                                  
                                </h5>
                            </div>
                        </div>
                        </div>
                    </Form> 
                </FormCard>
            </MainContainer>
        )
    }
}
export default connect(mapStateToProps, mapDispachToProps )(SessionView)