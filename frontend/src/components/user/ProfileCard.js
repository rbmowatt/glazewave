import React from 'react';
import { connect } from 'react-redux'
import ImageUploader from 'react-images-upload';
import moment from 'moment';
import UserRequests from './../../requests/UserRequests';
import { s3Conf } from './../../config/s3';
import {loadUser, updateUserImage} from './../../actions/user';

const mapStateToProps = state => {
    return { user : state.user, session : state.session }
  }
  const mapDispachToProps = dispatch => {
    return {
      //updateImage : (request, data) => dispatch( request.updateProfileImage({data: data , onSuccess : (data)=>{ return {type: "SESSION_IMAGE_UPDATED", payload: data}}})),
      updateImage : (session, params)=>dispatch(updateUserImage(session, params)),
      loadUser : (session, params)=>dispatch(loadUser(session, params))
    }}

class ProfileCard extends React.Component{

    constructor()
    {
        super();
        this.state = {
            board_id: null,
            manufacturer_id : null,
            uploaderInstance : 1
        };
        this.onDrop = this.onDrop.bind(this);
    }

    componentDidMount() {
        if (this.props.session.isLoggedIn) {
            this.props.loadUser(this.props.session, {id : this.props.session.user.id} );
        }
    }

    onDrop(pictureFiles, pictureDataURLs) {
        console.log('pic files', pictureFiles.length)
        const formData = UserRequests.createFormRequest({user_id : this.props.session.user.id});
        pictureFiles.forEach((file, i) => {
            formData.append('photo', file)
        })
        this.props.updateImage(this.props.session, { data : formData});
        this.setState({uploaderInstance : this.state.uploaderInstance + 1})
    }

render(){
    const {user} = this.props;
    const image = this.props.user.profile_img ? s3Conf.root +  this.props.user.profile_img : 'https://www.bootdey.com/img/Content/avatar/avatar7.png';
    return (
        <div className="container">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.0/css/all.min.css" />
            <div className="team-single">
                <div className="row">
                    <div className="col-lg-4 col-md-5 xs-margin-30px-bottom">
                        <div className="team-single-img">
                            <img src={image} alt="" />
                        </div>
                        <div className="bg-light-gray padding-30px-all md-padding-25px-all sm-padding-20px-all text-center">
                            <h4 className="margin-10px-bottom font-size24 md-font-size22 sm-font-size20 font-weight-600">{user.username}</h4>
                            <div className="sm-width-95 sm-margin-auto">
                                <ImageUploader
                                    key={this.state.uploaderInstance}
                                    withIcon={false}
                                    buttonText='Update Photo'
                                    onChange={this.onDrop}
                                    imgExtension={['.jpg', '.gif', '.png', '.gif']}
                                    maxFileSize={5242880}
                                    label=''
                                    withPreview={false}
                                    singleImage={true}
                                />
                            </div>
                            <div className="margin-20px-top team-single-icons">
                                <ul className="no-margin">
                                    <li><a href="#"><i className="fab fa-facebook-f"></i></a></li>
                                    <li><a href="#"><i className="fab fa-twitter"></i></a></li>
                                    <li><a href="#"><i className="fab fa-instagram"></i></a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-8 col-md-7">
                        <div className="team-single-text padding-50px-left sm-no-padding-left">
                            <h4 className="font-size38 sm-font-size32 xs-font-size30">{user.first_name} {user.last_name}</h4>
                            <p className="no-margin-bottom">
                                { /* text colud go here */}
                            </p>
                            <div className="contact-info-section margin-40px-tb">
                                <ul className="list-style9 no-margin">
                                    <li>
                                        <div className="row">
                                            <div className="col-md-5 col-5">
                                                <i className="far fa-gem text-yellow"></i>
                                                <strong className="margin-10px-left text-yellow">Member Since:</strong>
                                            </div>
                                            <div className="col-md-7 col-7">
                                                <p>{moment(user.createdAt).format("YYYY-MM-DD HH:mm:ss")}</p>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="row">
                                            <div className="col-md-5 col-5">
                                                <i className="fas fa-map-marker-alt text-green"></i>
                                                <strong className="margin-10px-left text-green">Region:</strong>
                                            </div>
                                            <div className="col-md-7 col-7">
                                                <p>Regina ST, London, SK.</p>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="row">
                                            <div className="col-md-5 col-5">
                                                <i className="fas fa-envelope text-pink"></i>
                                                <strong className="margin-10px-left xs-margin-four-left text-pink">Email:</strong>
                                            </div>
                                            <div className="col-md-7 col-7">
                                                <p><a href="javascript:void(0)">{user.email}</a></p>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <h5 className="font-size24 sm-font-size22 xs-font-size20">Professional Skills</h5>
                             <div className="sm-no-margin">
                                <div className="progress-text">
                                    <div className="row">
                                        <div className="col-7">Positive Behaviors</div>
                                        <div className="col-5 text-right">40%</div>
                                    </div>
                                </div>
                                <div className="custom-progress progress">
                                    <div role="progressbar" aria-valuenow="70" aria-valuemin="0" aria-valuemax="100" style={{width : "40%"}} className="animated custom-bar progress-bar slideInLeft bg-sky">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps)(ProfileCard)