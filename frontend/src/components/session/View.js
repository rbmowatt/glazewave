import './Session.css'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {FormCard} from './../layout/FormCard';
import { MainContainer } from './../layout/MainContainer';
import StarBar from './../layout/StarBar';
import SessionRequests from './../../requests/SessionRequests';

const mapStateToProps = state => {
    return { session: state.session, current_session : state.user_session }
  }

  const mapDispachToProps = dispatch => {
    return {
      loadSession: (request, session) => dispatch( request.getOne({label : 'LOAD_USER_SESSION', id : session.user.id ,  withs : ['SessionImage'], onSuccess : (data)=>{ return { type: "SET_USER_SESSION", payload: data}}})),
    };
  };

class SessionView extends Component {

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.props.loadSession(new SessionRequests(this.props.session), this.props.session );
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
        const pic = (!session.SessionImages || session.SessionImages.length === 0 || session.SessionImages[0].name == null) ? 'no_photo.jpg' : session.SessionImages[0].name;
        return (
            <MainContainer>
                <FormCard returnToIndex={this.returnToIndex}>
                    <div className="container">
				        <div className="wrapper row">
                            <div className="preview col-md-6">
                                <div className="preview-pic tab-content">
                                    <div className="tab-pane active" id="pic-1"><img src={"https://surfmemo.s3.amazonaws.com/" + pic } alt="session" /></div>
                                </div>
                            </div>
                            <div className="details col-md-6">
                                <h3 className="session-title">{session.title}</h3>
                                <h5 className="submitted-by">By <span>{session.createdAt}</span></h5>
                                <h5 className="review-no">Rated: {session.rating}/10 </h5>
                                <div className="rating">
                                    <StarBar stars={session.rating} />
                                </div>
                                <h5 className="review-no">Session:</h5>
                                <p className="session-description">{ session.title }</p>
                            </div>
                        </div>
                    </div>
                </FormCard>
            </MainContainer>
        )
    }
}
export default connect(mapStateToProps, mapDispachToProps )(SessionView)