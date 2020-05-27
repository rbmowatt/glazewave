import 'react-confirm-alert/src/react-confirm-alert.css'; 
import React, { Component } from 'react'
import { confirmAlert } from 'react-confirm-alert';
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import { MainContainer } from './../layout/MainContainer';
import SessionRequests from './../../requests/SessionRequests';
import SessionRow from './SessionRow';
import SessionCard from './../user/SessionCard';

const mapStateToProps = state => {
    return { session: state.session, sessions : state.user_sessions }
  }

  const mapDispachToProps = dispatch => {
    return {
        loadSessions: (request, session) => dispatch( request.get({label : 'LOAD_USER_SESSIONS', wheres : {user_id : session.user.id }, withs : ['Board', 'Location'], onSuccess : (data)=>{ return { type: "SET_USER_SESSIONS", payload: data}}})),
        deleteSession: (request, id) => dispatch( request.delete({label : 'DELETE_USER_SESSION', id:id , onSuccess : (data)=>{ return { type: "DELETE_USER_SESSION", payload: id }}}))
    };
  };

class SessionIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { sessions: [], headers : {}, isAdmin : false }
        this.deleteSession = this.deleteSession.bind(this);
        this.editSession = this.editSession.bind(this);
        this.viewSession = this.viewSession.bind(this);
       // this.sessionRequest = new SessionRequests(this.props.session);
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.setState({ isAdmin : this.props.session.isAdmin });
            this.props.loadSessions(new SessionRequests(this.props.session), this.props.session );
        }
    }

    deleteSession(id ) {
        confirmAlert({
            title: 'Confirm To Delete',
            message: 'Are you sure you want to delete this session?',
            buttons: [
              {
                label: 'Yes',
                onClick: () => {
                    this.props.deleteSession(new SessionRequests(this.props.session), id);
                }
              },
              {
                label: 'No',
                onClick: () => {}
              }
            ]
          });
    }

    editSession(sessionId) {
        this.props.history.push('/session/edit/' + sessionId);
    }

    viewSession(sessionId) {
        this.props.history.push('/session/' + sessionId);
    }

    render() {
        const {sessions} = this.props;
        return (
            <MainContainer>
                <div className="row">
                    <div className="card card-lg mx-auto">
                        <div className="card-title"><h2>Sessions
                        { this.state.isAdmin &&  <Link to={'session/create'} className="btn btn-sm btn-outline-secondary float-right"> Create New Session</Link>}
                        </h2>
                        </div> 
                        <div className="card-text">
                            <div className="table-container" >
                                <div className="row table-header">
                                    <div className="col-6">
                                         Title
                                    </div>
                                    <div className="col-3">
                                        Date
                                    </div>
                                    <div className="col-3">
                                        Location
                                    </div>
                                </div>
                                <div className="row col-md-12">
                                {sessions && sessions.sort((a,b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)).map(session =>
                                (this.state.isAdmin || session.isPublic) &&
                               
                                    <SessionCard session={session} key={session.id}  className="col-md-3" deleteSession={this.deleteSession} viewSession={this.viewSession} editSession={this.editSession}  />
                               
                                )
                                }
                                 </div>
                                {
                                    (!sessions  || sessions.length === 0) &&  <div className="col-12"><h3>No sessions found at the moment</h3></div>
                                } 
                             </div>
                        </div>
                    </div>
                </div>
            </MainContainer>
          
        )
    }
}
export default connect(mapStateToProps, mapDispachToProps)(SessionIndex)