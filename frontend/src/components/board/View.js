
import './Board.css'


import React, { Component } from 'react'
import { connect } from 'react-redux'
import {FormCard} from './../layout/FormCard';
import { Form } from 'react-advanced-form';
import { RIEInput, RIETextArea} from '@attently/riek';
import _ from 'lodash';
import {UserBoardUpdated} from './../../actions/user_board';
import SessionCard from './../session/SessionCard';

import  MainContainer  from './../layout/MainContainer';
import SessionRequests from './../../requests/SessionRequests';
import StarBar from './../layout/StarBar';
import UserBoardRequests from './../../requests/UserBoardRequests';
import BoardRequests from     './../../requests/BoardRequests';
import ManufacturerRequests from './../../requests/ManufacturerRequests';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faBookReader } from '@fortawesome/free-solid-svg-icons';
import ImageUploader from 'react-images-upload';
import ImageGallery from 'react-image-gallery';
import TypeAheadInput  from './../form/TypeAheadInput';
import { sizes } from './data/board_sizes';
import InlineEdit, { InputType } from 'riec';


const mapStateToProps = state => {
    return { session: state.session, board : state.user_boards.selected , boards: state.boards, shapers : state.shapers , images : state.user_board_images}
  }

  const mapDispachToProps = dispatch => {
    return {
      loadBoard: (request, props) => dispatch( request.getOne({ id : props.match.params.id,  withs : ['Board.Manufacturer', 'Session.SessionImage'], onSuccess : (data)=>{ return { type: "SET_USER_BOARD", payload: data}}})),
      loadSessions: (request, props) => dispatch( request.get({ wheres : {board_id : props.match.params.id,}, withs : [ 'Location', 'SessionImage'], onSuccess : (data)=>{ return { type: "SET_USER_SESSIONS", payload: data}}})),
      editUserBoard: (request, props, data)=>dispatch( request.update({ id : props.match.params.id, data: data, onSuccess : (data)=>{ return UserBoardUpdated(data)}})),
      loadShapers: (request, session) => dispatch( request.get({limit : 1000,   withs : ['Board'], onSuccess : (data)=>{ return {type: "SET_SHAPERS", payload: data}}})),
      loadBoards: (request, session) => dispatch( request.get({ limit : 1000,  withs : ['Manufacturer'], onSuccess : (data)=>{ return {type: "SET_BOARDS", payload: data}}})),
      loadBoardImages: (request, props) => dispatch( request.getImages({wheres : {user_board_id : props.match.params.id }, onSuccess : (data)=>{ return { type: "SET_USER_BOARD_IMAGES", payload: data}}})),
      addImages : (request, data) => dispatch( request.createImages({data: data , onSuccess : (data)=>{  return { type: "USER_BOARD_IMAGES_ADDED", payload: data}}})),
      deleteBoardImage : (request, data) => dispatch( request.deleteImage({id : data.id, onSuccess : (data)=>{ return {type: "USER_BOARD_IMAGE_DELETED", payload: data}}}))
    };
  };

class BoardView extends Component {
    constructor(props) {
        super(props);
        this.state = { session: [],
            board_id: '',
            manufacturer_id : '',
            uploaderInstance : 1,
            imageIndex : 0,
            modelPlaceholder : null,
            boardSizeOptions : this.prepBoardSizeOptions(sizes)
        }
        this.onDrop = this.onDrop.bind(this);
    }

    prepBoardSizeOptions = (sizes)=>
    {
        const filteredSizes = [];
        sizes.forEach(size=> filteredSizes.push({id : size }))
        return filteredSizes;
    }

    onTypeAheadSelected = (propertyName , newValue ) => {
        const data = [];
        data[propertyName] = newValue;
        //here we have to make sure to clear out the model if not belong to shaper
        if(propertyName === 'manufacturer_id'){
            const boardId = (!Number.isInteger(this.state.board_id)) ? this.props.board.id :this.state.board_id;
            const board = this.props.boards.find(board=> board.id === boardId); 
            console.log('boards', boardId, board)
            if( board && (board.manufacturer_id !== newValue))
            {
                data['board_id'] = ''
                data['modelPlaceholder'] = 'Choose A Board'
                console.log('board does not match manufactiure', newValue);
            }
        }
      
        this.setState({
            ...data
        });
        console.log('state', this.state)
      };

      getShaperSuggestions = (value, reason)  => {
        //if its empty or just focused let's show everything
        if(!value || reason === 'type_ahead_focused') return this.props.shapers;
 
        const inputValue = value.trim().toLowerCase();
        const inputLength = inputValue.length;
        return inputLength === 0 ? [] : this.props.shapers.filter(entity=>
            entity.name.toLowerCase().slice(0, inputLength) === inputValue
        );
      };

      getBoardSuggestions = (value, reason) => {
        //if its empty or just focused let's show everything
        if(!value || reason === 'type_ahead_focused'){
            const shaperId = (this.state.manufacturer_id === '') ? this.props.board.Board.manufacturer_id : this.state.manufacturer_id;
            return this.props.boards.filter(entity=>
                entity.manufacturer_id === shaperId
            );
        }
        const inputValue = value.trim().toLowerCase();
        const inputLength = inputValue.length;
        return inputLength === 0 ? [] : this.props.boards.filter(entity=>
            entity.model.toLowerCase().slice(0, inputLength) === inputValue && entity.manufacturer_id === this.state.manufacturer_id
        );
      };

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.props.loadBoard(new UserBoardRequests(this.props.session), this.props );
            this.props.loadSessions(new SessionRequests , this.props );
            this.props.loadBoards(new BoardRequests(this.props.session), this.props.session );
            this.props.loadShapers(new ManufacturerRequests(this.props.session), this.props.session );
            this.props.loadBoardImages(new UserBoardRequests(this.props.session), this.props );
        }
        else this.props.history.push('/board');
    }

    submitUpdate = ( data ) =>
    {
        this.props.editUserBoard(new UserBoardRequests(this.props.session), this.props , data);
        this.setState( data );
    }

    returnToIndex = e =>
    {
        this.props.history.length > 1 ?  this.props.history.goBack() : this.props.history.push('/board');
    }


    onDrop(pictureFiles, pictureDataURLs) {
        const formData = UserBoardRequests.createFormRequest({user_board_id : this.props.board.id, user_id : this.props.session.user.id});
        pictureFiles.forEach((file, i) => {
            formData.append('photo', file)
        })
        this.props.addImages(new UserBoardRequests(this.props.session), formData);
        this.setState({uploaderInstance : this.state.uploaderInstance + 1})
    }

    onImageLoad = (e) =>
    {
        console.log('imger loaded', this.props.images.length, e.target)
        this.setState({selectedImage : this.props.images[0]})
    }

    onImageSelected = (e) =>
    {
        this.setState({selectedImage : this.props.images[e], imageIndex : e})
    }

    deleteImage= (e) =>
    {
        new Promise ((resolve, reject)=>{
            resolve(this.props.deleteBoardImage(new UserBoardRequests(this.props.session), {id : this.state.selectedImage.id}))
        })
        .then(e=>{
            const newIndex = this.state.imageIndex === 0 ? 0 : this.state.imageIndex -1;
            this.setState( {imageIndex : newIndex, selectedImage : this.props.images[newIndex]})
        });
    }

    renderLeftNav() {
        return (
          <button
            className='image-gallery-custom-left-nav btn btn-primary'>hello
            </button>
        )
      }

    render() {
        const { board } = this.props;
        const modelPlaceholder = (this.state.modelPlaceholder) ? this.state.modelPlaceholder : board.Board && board.Board.model || 'Choose A Model';
        return (
            <MainContainer>
                <FormCard returnToIndex={this.returnToIndex}>
                    <Form>
				        <div className="wrapper row col-md-12 container">
                            <h2 className="details col-md-12">
                                <RIEInput
                                    required={false}
                                    value={board.name || ''}s
                                    defaultValue={board.name}
                                    change={this.submitUpdate}
                                    propName='name'
                                />
                            </h2>
                            <div className="preview col-md-6">
                                <div className="card" >
                                    <ImageGallery 
                                            items={this.props.images} 
                                            showBullets={true} 
                                            showIndex={true}
                                            startIndex={this.state.imageIndex}
                                            onSlide={this.onImageSelected} 
                                            showNav={false}
                                            //renderCustomControls={this.renderLeftNav}
                                            onImageLoad={this.onImageLoad}
                                            className="card-img-top" />
                                    <div className="card-body">
                                        <div className="card-text"><ImageUploader
                                                key={this.state.uploaderInstance}
                                                withIcon={false}
                                                buttonText='Add Images!'
                                                onChange={this.onDrop}
                                                imgExtension={['.jpg', '.gif', '.png', '.gif']}
                                                maxFileSize={5242880}
                                                label=''
                                                withPreview={false}/>
                                                <FontAwesomeIcon  size="lg"  alt="delete user" style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}}  icon={faTrash} 
                                                onClick={this.deleteImage} value={this.state.imageIndex}/> 
                                            </div>
                                    </div>
                                </div>
                            </div>
                            <div className="details col-md-6">
                                <div className="detail-line">
                                    <StarBar stars={board.rating} onClick={this.submitUpdate } size="1x"/>
                                </div>
                                <div className="detail-line">
                                    <strong>Size:</strong>
                                   &nbsp; 
                                   <InlineEdit
                                        type={InputType.Select}
                                        value={board.size}
                                        onChange={(data)=>{this.submitUpdate({size : data})}}
                                        options={this.state.boardSizeOptions}
                                        valueKey="id"
                                        labelKey="id"
                                    /> 
                                </div>
                                <div className="detail-line">
                                    <div><strong>Shaper/Company:</strong></div>
                                    <TypeAheadInput  entity={this.props.shapers} name="manufacturer_id" 
                                        keyName="name"
                                        className="form-control" 
                                        placeholder={board.Board && board.Board.Manufacturer && board.Board.Manufacturer.name || 'Choose A Shaper'}
                                        value={this.state.manufacturer_id} 
                                        setValue={this.onTypeAheadSelected} 
                                        getSuggestions={this.getShaperSuggestions} 
                                        display={true} 
                                    />
                                </div>
                                <div className="detail-line">
                                    <div><strong>Model:</strong></div>
                                    <TypeAheadInput  entity={this.props.boards} name="board_id" 
                                        keyName="model"
                                        className="form-control" 
                                        placeholder={modelPlaceholder}
                                        value={this.state.board_id} 
                                        setValue={this.onTypeAheadSelected} 
                                        getSuggestions={this.getBoardSuggestions} 
                                        display={true} 
                                    />
                                </div>
                                <div className="detail-line">
                                <div><strong>Notes:</strong></div>
                               
                                        <RIETextArea
                                            value={board.notes || 'You have no notes for this session'}
                                            defaultValue={board.notes}
                                            className="form-control text-area"
                                            change={this.submitUpdate }
                                            propName='notes'
                                            validate={_.isString} 
                                        />
                                       
                                    </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="row col-md-12 card-title"><h5>Used In Sessions...</h5></div>
                                <div className="card-text">
                                    <div className="table-container" >
                                        <div className="row">
                                            {board.Sessions && 
                                            board.Sessions.reduce((mappedArray, session, index) => {                           
                                                                    if (index < 3) { 
                                                                        mappedArray.push(
                                                                            <div className="col-md-4">
                                                                            <div key={session.id} className="card row">
                                                                            <SessionCard session={session} key={session.id} className="row col-md-12" />
                                                                            </div>
                                                                            </div>
                                                                        );
                                                                    }                                                  
                                                                    return mappedArray;
                                                                }, 
                                                            [])
                                            }
                                            {
                                                (!board.Sessions || board.Sessions.length === 0) &&  <div className="col-12"><h3>No Sessions found at the moment</h3></div>
                                            } 
                                        </div>
                                     </div>
                                </div>
                        </div>
                  
                    </Form>
                </FormCard>
            </MainContainer>
        )
    }
}
export default connect(mapStateToProps, mapDispachToProps)(BoardView)