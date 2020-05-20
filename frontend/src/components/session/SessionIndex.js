import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import SessionRow from './SessionRow';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css


const mapStateToProps = state => {
    return { session: state.session }
  }

class SessionIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { sessions: [], headers : {}, isAdmin : false }
        this.deleteSession = this.deleteSession.bind(this);
        this.editSession = this.editSession.bind(this);
        this.viewSession = this.viewSession.bind(this);
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.setState({ isAdmin : this.props.session.isAdmin });
            const headers = { headers: { Authorization: `Bearer ${this.props.session.credentials.accessToken}`}};
            this.setState({headers});
            axios.get( apiConfig.host + apiConfig.port + `/api/session`, headers).then(data => {
                data.data.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
                this.setState({ sessions: data.data })
            });
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
                    axios.delete(apiConfig.host + apiConfig.port + `/api/session/${id}`, this.state.headers).then(data => {
                        const index = this.state.sessions.findIndex(session => session.id === id);
                        this.state.sessions.splice(index, 1);
                        this.props.history.push('/session');
                    })
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
        const sessions = this.state.sessions;
        return (
            <MainContainer>
                <div className="row">
                    <div className="card mx-auto">
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
                                {sessions && sessions.map(session =>
                                (this.state.isAdmin || session.isPublic) &&
                                    <SessionRow session={session} deleteSession={this.deleteSession} viewSession={this.viewSession} editSession={this.editSession} isAdmin={this.state.isAdmin} key={ session.id }/>
                                )
                                }
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
export default connect(mapStateToProps)(SessionIndex)