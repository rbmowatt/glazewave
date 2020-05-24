import * as React from 'react';
import { connect } from 'react-redux'
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import { Link } from 'react-router-dom';
import SessionCard from './SessionCard';
import BoardCard from './BoardCard';
import LocationCard from './LocationCard';
import UserRequests from './../../requests/UserRequests';

const mapStateToProps = state => {
    return { session: state.session }
  }

class UserDashnoard extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            user: {},
            boards : [],
            sessions : [],
            locations: []
        }
        this.userRequest = new UserRequests(this.props.session);
    }

    componentDidMount() {
        if (this.props.session.isLoggedIn) {
            this.userRequest.getOne(this.props.session.user.id , ['UserBoard', 'Session.SessionImage','UserLocation'])
            .then(data => {
                this.setState({ user: data.data, boards: data.data.UserBoards, locations: data.data.UserLocations, sessions: data.data.Sessions });
            })
            .catch(error=>console.log(error));
        }
    }

    render() {
        console.log('sessions', this.state.sessions);
        const {boards, sessions, locations } = this.state;
        return (
           <MainContainer>
                <div className="row">
                    <div className="card card-lg mx-auto">
                        <div className="card-title">
                           <h2> <strong>Users</strong> <Link to={'user/create'} className="btn btn-sm btn-outline-secondary float-right"> Create New User</Link></h2>
                        </div>
                        <div className="card-text dashboard-boxes">
                                <div className="row">
                                    <div className="col-md-1 row">
                                        <div className="card">
                                        <div> <Link to={'/session/create'} className="btn btn-sm btn-outline-secondary float-right"> New Session</Link></div> 
                                            <div> <Link to={'/board/create'} className="btn btn-sm btn-outline-secondary float-right">New Board</Link></div> 
                                          
                                            <div><a href="#">dddddd</a></div> 
                                        </div>
                                    </div>
                                    <div className="col-md-11 row">
                                            <div className="col-md-4">
                                                    Sessions
                                                    {sessions && sessions.map(session =>
                                                    <div className="card row">
                                                        <SessionCard session={session} key={session.id} />
                                                        </div>
                                                    )}
                                            </div>
                                            <div className="col-md-4">
                                         
                                                    Boards
                                                    {boards && boards.map(board =>
                                                    <div className="card row">
                                                        <BoardCard board={board} key={board.id} />
                                                        </div>
                                                    )}
                                            
                                            </div>
                                            <div className="col-md-4">
                                         
                                                Locations
                                         {locations && locations.map(location =>
                                         <div className="card row">
                                             <LocationCard location={location} key={location.id} />
                                             </div>
                                         )}
                                 
                                 </div>
                                    </div>
                                </div>
                            
                        </div>
                    </div>
                </div>
            </MainContainer>
        )
    }
}

export default connect(mapStateToProps)(UserDashnoard)
