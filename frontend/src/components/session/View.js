import './Session.css';
import "react-datepicker/dist/react-datepicker.css";
import _ from 'lodash'
import moment from 'moment'
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Form } from 'react-advanced-form';
import {FormCard} from './../layout/FormCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { RIEInput, RIETextArea} from '@attently/riek';
import DatePicker from "react-datepicker";
import ImageUploader from 'react-images-upload';
import ImageGallery from 'react-image-gallery';
import InlineEdit, { InputType } from 'riec';
import Location from './../form/Location';
import MainContainer from './../layout/MainContainer';
import StarBar from './../layout/StarBar';
import SessionRequests from './../../requests/SessionRequests';
import {loadUserBoards} from './../../actions/user_board';
import {UserSessionCleared,loadUserSession, updateUserSession, loadUserSessionImages, addUserSessionImages, deleteUserSessionImage} from './../../actions/user_session';
import WWClient from './../../lib/utils/worldweather'
import noaaForecaster from 'noaa-forecasts';
import { s3Conf } from './../../config/s3';

import BoardPicker from './../board/forms/BoardPicker';


const mapStateToProps = state => {
    return { 
        session: state.session, 
        current_session : state.user_sessions.selected, 
        boards : state.user_boards.data, 
        session_images : state.session_images, 
        api:state.api 
    }
  }

  const withs = {
    session : ['Location', 'UserBoard.UserBoardImage']
  }

  const mapDispachToProps = dispatch => {
    return {
      loadSession : (session, params)=>dispatch(loadUserSession(session, params)),
      loadBoards: (session, params) => dispatch(loadUserBoards(session, params)),
      clearSession : ()=>dispatch(UserSessionCleared()),
      editUserSession: (session, params) => dispatch(updateUserSession(session, params)), 
      loadSessionImages: (session, params) => dispatch(loadUserSessionImages(session, params)), 
      addImages : (session, params) => dispatch(addUserSessionImages(session, params)), 
      deleteSessionImage: (session, id) => dispatch( deleteUserSessionImage (session, id))
    };
  };

class SessionView extends Component {

    
    constructor(props)
    {
        super(props)
        this.UserSessionRequest = new SessionRequests(props.session);
        
        this.state = { 
            boards : [], 
            select: {id : 0, name : 'No Board Selected'},
            selectedImage : null,
            selectOptions: [],
            uploaderInstance : 1,
            imageIndex : 0,
            date: '',
            defaultImage : "https://image.shutterstock.com/image-vector/please-no-photo-camera-vector-260nw-473234290.jpg"
        };
        this.onDrop = this.onDrop.bind(this);
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.props.loadBoards(this.props.session, {wheres : {user_id : this.props.session.user.id }} );
            this.props.loadSession(this.props.session, {id : this.props.match.params.id,  withs : withs.session});
            this.props.loadSessionImages(this.props.session, {wheres : {session_id : this.props.match.params.id }} );
        }
       else{
            this.props.history.push('/session');
       }
    }


    onDrop(pictureFiles, pictureDataURLs) {
        if(!pictureFiles.length) return;
        const formData = SessionRequests.createFormRequest({session_id : this.props.current_session.id, user_id : this.props.session.user.id});
        pictureFiles.forEach((file, i) => {
            formData.append('photo', file)
        })
        this.props.addImages(this.props.session, { data : formData});
        this.setState({uploaderInstance : this.state.uploaderInstance + 1})
      
    }

    componentDidUpdate()
    {
        (this.props.boards.length && !this.state.selectOptions.length && this.props.current_session.id) && this.setSelectedBoard();
    }

    setSelectedBoard = () =>
    {
        const boardOptions = [{id : 0, name : 'select'}];
        let select = this.state.select
        this.props.boards.map((obj) => {
            let board = { id : obj.id , name : obj.name};
            if(obj.id === this.props.current_session.board_id) select = board;
            boardOptions.push(board) 
        })
        this.setState({selectOptions: boardOptions, select : select})
    }

    componentWillUnmount(){
        this.props.clearSession();
    }

    returnToIndex = e =>
    {
        this.props.history.length > 1 ?  this.props.history.goBack() : this.props.history.push('/user/dashboard');
    }

    submitUpdate = ( data ) =>
    {
        this.props.editUserSession(this.props.session ,{id : this.props.match.params.id, data : data});
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
        if(!id) return;
        this.submitUpdate({ board_id : id});
        const idInt = parseInt(id);
        this.state.selectOptions.map((obj) => {
            if(obj.id === idInt ) this.setState({select : obj});
            return true;
        })
    }

    onImageLoad = (e) =>
    {
        console.log('imger loaded', this.props.session_images.length, e.target)
        this.setState({selectedImage : this.props.session_images[0]})
    }

    onImageSelected = (e) =>
    {
        this.setState({selectedImage : this.props.session_images[e], imageIndex : e})
    }

    deleteImage= (e) =>
    {
        new Promise ((resolve, reject)=>{
            resolve(this.props.deleteSessionImage(this.props.session, this.state.selectedImage.id))
        })
        .then(e=>{
            const newIndex = this.state.imageIndex === 0 ? 0 : this.state.imageIndex -1;
            this.setState( {imageIndex : newIndex, selectedImage : this.props.session_images[newIndex]})
        });
    }

    onDateChange = date => {
        let formattedDate = moment(date).format("YYYY-MM-DD HH:mm:ss");
        this.submitUpdate({session_date : formattedDate})
        this.setState({date : date})
      };

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
                                    <div className="card" >
                                    <ImageGallery 
                                            items={this.props.session_images} 
                                            showBullets={true} 
                                            showIndex={true}
                                            startIndex={this.state.imageIndex}
                                            onSlide={this.onImageSelected} 
                                            onImageLoad={this.onImageLoad}/>
                                    <div className="card-body">
                                        <div className="card-text">
                                            <ImageUploader
                                                key={this.state.uploaderInstance}
                                                withIcon={true}
                                                buttonText='Add Images!'
                                                onChange={this.onDrop}
                                                imgExtension={['.jpg', '.gif', '.png', '.gif']}
                                                maxFileSize={5242880}
                                                withPreview={false}
                                            />
                                            <FontAwesomeIcon  
                                                size="lg"  
                                                alt="delete user" 
                                                style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}}  
                                                icon={faTrash} 
                                                onClick={this.deleteImage} value={this.state.imageIndex}/> 
                                            </div>
                                    </div>
                                </div>
                                </div>
                                <div className="details col-md-5">
                                    <div className="container">
                                    <div className="detail-line">
                                        <StarBar stars={session.rating} onClick={this.submitUpdate } size="md" />
                                    </div>
                                    <div className="detail-line">
                                        <Location 
                                            id="location_id" 
                                            name="location_id" 
                                            className="form-control" 
                                            onChange={this.onLocationChange} 
                                            onBlur={this.onLocationBlur}
                                            value={session.location_id} 
                                            placeholder={(session.Location) ? session.Location.formatted_address : 'No Location Specified'} 
                                        />
                                    </div>
                                    <div className="detail-line">
                                        <div><strong>Date:</strong></div>
                                        <DatePicker
                                            selected={this.state.date}
                                            className="date-picker-input form-control"
                                            onChange={this.onDateChange} //only when value has changed
                                            showTimeSelect
                                            dateFormat={'MMMM d yyyy h:mm a'}
                                            placeholderText={moment(session.session_date).format('MMMM D YYYY h:mm a')}
                                            />
        
                                    </div>                       
                                    <BoardPicker 
                                        onChange= {this.onBoardChange} 
                                        boards={this.state.selectOptions} 
                                        name={this.state.select.name} 
                                        board_id={session.board_id} 
                                        wrapperClass="row detail-line"
                                    />    
                                    <div className="detail-line">
                                        <div><strong>Notes:</strong></div>
                                        <RIETextArea
                                            value={session.notes || 'You have no notes for this session'}
                                            className="form-control text-area"
                                            defaultValue={session.notes}
                                            change={this.submitUpdate }
                                            propName='notes'
                                            validate={_.isString} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </Form> 
                </FormCard>
            </MainContainer>
        )
    }

    loadNoaa = () =>
    {
        var inspect = require('util').inspect;
        var obj = {
            listLatLon: '38.99,-77.01 37.7833,-122.4167',
            //product: 'time-series', // this is a default, it's not actually required
            begin: moment().format('YYYY-MM-DDTHH:mm:ss'),
            end: moment().add(3, 'days').format('YYYY-MM-DDTHH:mm:ss'),
            qpf: 'qpf', // first elementInputName - Liquid Precipitation Amount
            pop12: 'pop12' // another elementInputName - 12 hour probability of precipitation    
            };
            var token = 'yPMNDtzDeHIgQPxhrkzuKJHGKlzGkSQV';
            noaaForecaster.setToken(token);
            noaaForecaster.getForecast(obj)
            .then(function(results) {
                console.log(inspect(results, { colors: true, depth: Infinity }));
            });
    }

    loadWorldWeather = () =>
    {
        WWClient.marineWeatherApi({
            q: "39.6439329,-74.18136799999999",
            tide : "yes"
        }, function(err, result) {
            if (!err) {
                console.log(result);
            } else {
                console.log(err);
            }
        });
    }
}
export default connect(mapStateToProps, mapDispachToProps )(SessionView)