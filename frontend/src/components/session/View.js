import './Session.css'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {FormCard} from './../layout/FormCard';
import { MainContainer } from './../layout/MainContainer';
import StarBar from './../layout/StarBar';
import SessionRequests from './../../requests/SessionRequests';
import ImageGallery from 'react-image-gallery';

const mapStateToProps = state => {
    return { session: state.session, current_session : state.user_session, session_images : state.session_images }
  }

  const mapDispachToProps = dispatch => {
    return {
      loadSession: (request, props) => dispatch( request.getOne({label : 'LOAD_USER_SESSION', id : props.match.params.id,  withs : ['SessionImage'], onSuccess : (data)=>{ return { type: "SET_USER_SESSION", payload: data}}})),
      loadSessionImages: (request, props) => dispatch( request.getImages({label : 'LOAD_SESSION_IMAGES', wheres : {session_id : props.match.params.id }, onSuccess : (data)=>{ return { type: "SET_SESSION_IMAGES", payload: data}}})),
   
    };
  };

class SessionView extends Component {

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.props.loadSession(new SessionRequests(this.props.session), this.props );
            this.props.loadSessionImages(new SessionRequests(this.props.session), this.props );
        }
       else{
            this.props.history.push('/session');
       }
    }

    returnToIndex = e =>
    {
      this.props.history.push('/user/dashboard');
    }

    render() {
        const session = this.props.current_session;
    
        return (
            <MainContainer>
                <FormCard returnToIndex={this.returnToIndex}>
                    <div className="container">
				        <div className="wrapper row">
                        <div className="details col-md-12">
                                <h3 className="session-title">{session.title}</h3>
                        </div>
                            <div className="preview col-md-7">
                                <ImageGallery items={this.props.session_images} />
                            </div>
                            <div className="details col-md-5">
                            <div className="rating">
                                    <StarBar stars={session.rating} />
                                </div>
                                <h5 className="submitted-by">Date: <span>{session.createdAt}</span></h5>
                                <h5 className="submitted-by">Board: <span>{session.createdAt}</span></h5>
                                <h5 className="submitted-by">Location: <span>{session.createdAt}</span></h5>
                                <h5 className="review-no">Notes:</h5>
                                <p className="session-description">{ session.notes}</p>
                            </div>
                        </div>
                    </div>
                </FormCard>
            </MainContainer>
        )
    }
}
export default connect(mapStateToProps, mapDispachToProps )(SessionView)