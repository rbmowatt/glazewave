import 'react-confirm-alert/src/react-confirm-alert.css'; 
import React, { Component } from 'react'
import { confirmAlert } from 'react-confirm-alert';
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import { MainContainer } from './../layout/MainContainer';
import SessionRequests from './../../requests/SessionRequests';
import SessionCard from './SessionCard';

const mapStateToProps = state => {
    return { session: state.session, sessions : state.user_sessions.data }
  }

  const mapDispachToProps = dispatch => {
    return {
        loadSessions: (request, session) => dispatch( request.get({ orderBy : 'created_at_DESC',  wheres : {user_id : session.user.id }, withs : ['UserBoard', 'Location', 'SessionImage'], onSuccess : (data)=>{ return { type: "SET_USER_SESSIONS", payload: data}}})),
        deleteSession: (request, id) => dispatch( request.delete({id:id , onSuccess : (data)=>{ return { type: "DELETE_USER_SESSION", payload: id }}}))
    };
  };

class SessionIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { sessions: [], headers : {}, isAdmin : false }
        this.deleteSession = this.deleteSession.bind(this);
        this.editSession = this.editSession.bind(this);
        this.viewSession = this.viewSession.bind(this);
        this.sessionRequest = new SessionRequests(this.props.session);
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.setState({ isAdmin : this.props.session.isAdmin });
            this.props.loadSessions(this.sessionRequest , this.props.session );
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
                    this.props.deleteSession(this.sessionRequest, id);
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
                        { <Link to={'session/create'} className="btn btn-sm btn-outline-secondary float-right"> Create New Session</Link>}
                        </h2>
                        </div> 
                        <div className="card-text">
                            <div className="table-container" >
                                <div className="row col-md-12">
                                {sessions && sessions.map(session =>                        
                                    <SessionCard session={session} key={session.id}  className="col-md-3" deleteSession={this.deleteSession} viewSession={this.viewSession} editSession={this.editSession}  />                              
                                )}
                                {
                                    (!sessions  || sessions.length === 0) &&  <div className="col-12"><h3>No sessionS found at the moment</h3></div>
                                } 
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </MainContainer>
          
        )
    }
}
export default connect(mapStateToProps, mapDispachToProps)(SessionIndex)