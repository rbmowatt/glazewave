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
import { RIEInput, RIETextArea} from '@attently/riek'
import _ from 'lodash'
import {UserBoardsLoaded} from './../../actions/user_board';
import Location from './../form/Location';
import InlineEdit, { InputType } from 'riec';
import ImageUploader from 'react-images-upload';

const mapStateToProps = state => {
    return { session: state.session, current_session : state.user_sessions.selected, boards : state.user_boards, session_images : state.session_images }
  }

  const withs = {
    session : ['Location', 'UserBoard.UserBoardImage']
  }

  const mapDispachToProps = dispatch => {
    return {
      loadSession: (request, props) => dispatch( request.getOne({id : props.match.params.id,  withs : withs.session , onSuccess : (data)=>{ return { type: "SET_USER_SESSION", payload: data}}})),
      loadSessionImages: (request, props) => dispatch( request.getImages({wheres : {session_id : props.match.params.id }, onSuccess : (data)=>{ return { type: "SET_SESSION_IMAGES", payload: data}}})),
      clearSession : ()=>dispatch({ type: "CLEAR_USER_SESSION"}),
      editSession : (request, props, data)=>dispatch( request.update({ id : props.match.params.id, data: data, onSuccess : (data)=>{ return { type: "USER_SESSION_UPDATED", payload: data}}})),
      loadBoards: (request, session) => dispatch( request.get({wheres : {user_id : session.user.id },  onSuccess : (data)=>{ return UserBoardsLoaded(data)}})),
      addImages : (request, data) => dispatch( request.createImages({data: data , onSuccess : (data)=>{ return {type: "SESSION_IMAGES_ADDED", payload: data}}})),
      deleteImage : (request, data) => dispatch( request.deleteImage({id : data.id, onSuccess : (data)=>{ return {type: "SESSION_IMAGE_DELETED", payload: data}}}))
    };
  };

class SessionView extends Component {

    
    constructor(props)
    {
        super(props)
        this.UserSessionRequest = new SessionRequests(props.session);
        
        this.state = { 
            notes : '', 
            boards : [], 
            select: {id : 0, name : 'No Board Selected'},
            selectedImage : {},
            selectOptions: [],
            uploaderInstance : 1,
            imageIndex : 0
        };
        this.onDrop = this.onDrop.bind(this);
    }


    onDrop(pictureFiles, pictureDataURLs) {
        const formData = SessionRequests.createFormRequest({session_id : this.props.current_session.id, user_id : this.props.session.user.id});
        pictureFiles.forEach((file, i) => {
            formData.append('photo', file)
        })
        this.props.addImages(new SessionRequests(this.props.session), formData);
        this.props.loadSessionImages(new SessionRequests(this.props.session), this.props );
        const ul = this.state.uploaderInstance + 1;
        this.setState({uploaderInstance : ul })
      
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.props.loadBoards(new UserBoardRequests(this.props.session), this.props.session );
            this.props.loadSession(this.UserSessionRequest , this.props);
            this.props.loadSessionImages(new SessionRequests(this.props.session), this.props );
        }
       else{
            this.props.history.push('/session');
       }
    }

    componentWillUpdate()
    {
        (this.props.boards.length && !this.state.selectOptions.length) && this.setSelectedBoard();
        this.props.current_session.rating === 0 && this.setState({rating : this.props.current_session.rating})
    }

    setSelectedBoard = () =>
    {
        const boardOptions = [];
        let select = this.state.select
        this.props.boards.map((obj) => {
            let board = { id : obj.id , name : obj.name};
            if(obj.id === this.props.current_session.board_id) select = board;
            return boardOptions.push(board) 
        })
        this.setState({selectOptions: boardOptions, select : select})
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
        this.props.editSession(this.UserSessionRequest, this.props , data);
        this.setState( data );
    }

    
    onLocationChange = (propertyName , newValue ) => {
        if(!newValue) return;
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

    onImageUpdated = (e) =>
    {
        console.log('img updated', this.props.session_images[e]);
        this.setState({selectedImage : this.props.session_images[e], imageIndex : e})
    }

    deleteImage= (e) =>
    {
        console.log('img delete', e.target.value);
        this.props.deleteImage(new SessionRequests(this.props.session), {id : this.state.selectedImage.id})
        const newIndex = this.state.imageIndex === 0 ? 0 : this.state.imageIndex -1;
        this.setState( {imageIndex : newIndex})
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
                                        value={session.title || ''}
                                        defaultValue={session.title}
                                        change={this.submitUpdate}
                                        propName='title'
                                        /></h3>
                                    </div>
                                <div className="preview col-md-7">
                                    <button onClick={this.deleteImage}value={this.state.imageIndex}>Delete Image</button>
                                    <ImageGallery 
                                        items={this.props.session_images} 
                                        showBullets={true} 
                                        showIndex={true}
                                        startIndex={this.state.imageIndex}
                                        onSlide={this.onImageUpdated} />
                                    <ImageUploader
                                        key={this.state.uploaderInstance}
                                        withIcon={false}
                                        buttonText='Add Images!'
                                        onChange={this.onDrop}
                                        imgExtension={['.jpg', '.gif', '.png', '.gif']}
                                        maxFileSize={5242880}
                                        withPreview={false}
                                    />
                                </div>
                                <div className="details col-md-5">
                               
                                    <Location 
                                        id="location_id" 
                                        name="location_id" 
                                        className="form-control" 
                                        onChange={this.onLocationChange} 
                                        onBlur={this.onLocationBlur}
                                        value={session.location_id} 
                                        placeholder={(session.Location) ? session.Location.formatted_address : 'No Location Specified'} 
                                    />
                                
                                <div className="rating">
                                    <StarBar stars={session.rating} onClick={this.submitUpdate } />
                                </div>
                                <h6 className="submitted-by"><span>{moment(session.createdAt).format('MMMM D YYYY h:mm a')}</span></h6>
                                <h6 className="submitted-by">Board: <span>
                                    <InlineEdit
                                        type={InputType.Select}
                                        value={this.state.select.name}
                                        onChange={this.onBoardChange}
                                        options={this.state.selectOptions}
                                        valueKey="id"
                                        labelKey="name"
                                        />                            
                                    </span>
                                </h6>
                                <h6 className="review-no">Notes: </h6>
                                    <RIETextArea
                                        value={session.notes || 'You have no notes for this session'}
                                        defaultValue={session.notes}
                                        change={this.submitUpdate }
                                        propName='notes'
                                        validate={_.isString} 
                                        />
                               
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