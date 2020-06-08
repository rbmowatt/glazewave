import React from 'react';
import { connect } from 'react-redux'
import ImageUploader from 'react-images-upload';
import moment from 'moment';
import UserRequests from './../../requests/UserRequests';
import { s3Conf } from './../../config/s3';

const mapStateToProps = state => {
    return { user : state.session.user, session : state.session }
  }
  const mapDispachToProps = dispatch => {
    return {
      addImages : (request, data) => dispatch( request.updateProfileImage({data: data , onSuccess : (data)=>{ return {type: "SESSION_IMAGE_UPDATED", payload: data}}}))
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

    onDrop(pictureFiles, pictureDataURLs) {
        console.log('pic files', pictureFiles.length)
        const formData = UserRequests.createFormRequest({user_id : this.props.session.user.id});
        pictureFiles.forEach((file, i) => {
            formData.append('photo', file)
        })
        this.props.addImages(new UserRequests(this.props.session), formData);
        //this.setState({uploaderInstance : this.state.uploaderInstance + 1})
    }

render(){
    const {user} = this.props;
    const image = this.props.user.profile_img ? s3Conf.root +  this.props.user.profile_img : 'https://www.bootdey.com/img/Content/avatar/avatar7.png';
    return (
        <div class="container">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.0/css/all.min.css" />
            <div class="team-single">
                <div class="row">
                    <div class="col-lg-4 col-md-5 xs-margin-30px-bottom">
                        <div class="team-single-img">
                            <img src={image} alt="" />
                        </div>
                        <div class="bg-light-gray padding-30px-all md-padding-25px-all sm-padding-20px-all text-center">
                            <h4 class="margin-10px-bottom font-size24 md-font-size22 sm-font-size20 font-weight-600">{user.username}</h4>
                            <p class="sm-width-95 sm-margin-auto">
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
                            </p>
                            <div class="margin-20px-top team-single-icons">
                                <ul class="no-margin">
                                    <li><a href="javascript:void(0)"><i class="fab fa-facebook-f"></i></a></li>
                                    <li><a href="javascript:void(0)"><i class="fab fa-twitter"></i></a></li>
                                    <li><a href="javascript:void(0)"><i class="fab fa-instagram"></i></a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-8 col-md-7">
                        <div class="team-single-text padding-50px-left sm-no-padding-left">
                            <h4 class="font-size38 sm-font-size32 xs-font-size30">{user.first_name} {user.last_name}</h4>
                            <p class="no-margin-bottom">
                                { /* text colud go here */}
                            </p>
                            <div class="contact-info-section margin-40px-tb">
                                <ul class="list-style9 no-margin">
                                    <li>
                                        <div class="row">
                                            <div class="col-md-5 col-5">
                                                <i class="far fa-gem text-yellow"></i>
                                                <strong class="margin-10px-left text-yellow">Member Since:</strong>
                                            </div>
                                            <div class="col-md-7 col-7">
                                                <p>{moment(user.createdAt).format("YYYY-MM-DD HH:mm:ss")}</p>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <div class="row">
                                            <div class="col-md-5 col-5">
                                                <i class="fas fa-map-marker-alt text-green"></i>
                                                <strong class="margin-10px-left text-green">Region:</strong>
                                            </div>
                                            <div class="col-md-7 col-7">
                                                <p>Regina ST, London, SK.</p>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <div class="row">
                                            <div class="col-md-5 col-5">
                                                <i class="fas fa-envelope text-pink"></i>
                                                <strong class="margin-10px-left xs-margin-four-left text-pink">Email:</strong>
                                            </div>
                                            <div class="col-md-7 col-7">
                                                <p><a href="javascript:void(0)">{user.email}</a></p>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <h5 class="font-size24 sm-font-size22 xs-font-size20">Professional Skills</h5>
                             <div class="sm-no-margin">
                                <div class="progress-text">
                                    <div class="row">
                                        <div class="col-7">Positive Behaviors</div>
                                        <div class="col-5 text-right">40%</div>
                                    </div>
                                </div>
                                <div class="custom-progress progress">
                                    <div role="progressbar" aria-valuenow="70" aria-valuemin="0" aria-valuemax="100" style={{width : "40%"}} class="animated custom-bar progress-bar slideInLeft bg-sky">
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