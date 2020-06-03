import * as React from 'react';
import { connect } from 'react-redux'
import { MainContainer } from './../layout/MainContainer';
import { Link } from 'react-router-dom';
import SessionCard from './../session/SessionCard';
import BoardCard from './BoardCard';
import LocationCard from './LocationCard';
import UserRequests from './../../requests/UserRequests';
import UserBoardRequests from './../../requests/UserBoardRequests';
import UserSessionRequests from './../../requests/SessionRequests';
import {UserSessionsLoaded} from './../../actions/user_session';
import {UserBoardsLoaded} from './../../actions/user_board';
import {UserLoaded} from './../../actions/user';

const DASHBOARD_LIST_LIMIT = 3; 
const mapStateToProps = state => {
    return { session: state.session, boards : state.user_boards, user_sessions : state.user_sessions.data, locations : state.user.UserLocations }
  }

  const withs = 
  {
    user : ['UserLocation'],
    boards : ['Board'],
    sessions : ['UserBoard', 'SessionImage', 'Location']
  }

  const mapDispachToProps = dispatch => {
    return {
        loadUser : (request, session) => dispatch( request.getOne({id :session.user.id , withs : withs.user, onSuccess : (data)=>{ return UserLoaded(data)}})),
        loadBoards: (request, session) => dispatch( request.get({wheres : {user_id : session.user.id }, withs : withs.boards, onSuccess : (data)=>{ return UserBoardsLoaded(data)}})),
        loadSessions: (request, session) => dispatch( request.get({wheres : {user_id : session.user.id }, withs : withs.sessions, onSuccess : (data)=>{return UserSessionsLoaded(data)}})),
    };
  };

class UserDashboard extends React.Component{

    componentDidMount() {
        if (this.props.session.isLoggedIn) {
            this.props.loadUser(new UserRequests(this.props.session), this.props.session );
            this.props.loadBoards(new UserBoardRequests(this.props.session), this.props.session );
            this.props.loadSessions(new UserSessionRequests(this.props.session), this.props.session );
        }
    }
    
    render() {
        const { user_sessions, boards, locations } = this.props;
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
                                            {
                                                user_sessions && user_sessions.reduce((mappedArray, session, index) => {                           
                                                        if (index < DASHBOARD_LIST_LIMIT) { 
                                                            mappedArray.push(
                                                                <div key={session.id} className="card row">
                                                                <SessionCard session={session} key={session.id} className="row col-md-12" />
                                                                </div>
                                                            );
                                                        }                                                  
                                                        return mappedArray;
                                                    }, [])
                                            }
                                        </div>
                                        <div className="col-md-4">
                                                Boards
                                            {
                                                boards && boards.reduce((mappedArray, board, index) => {                           
                                                        if (index < DASHBOARD_LIST_LIMIT) { 
                                                            mappedArray.push(
                                                                <div key={board.id} className="card row">
                                                                    <BoardCard board={board} key={board.id} className="row col-md-12" />
                                                                </div>
                                                            );
                                                        }                                                  
                                                        return mappedArray;
                                                    }, [])
                                            }                              
                                        </div>
                                        <div className="col-md-4">
                                            Locations
                                            {
                                                locations && locations.reduce((mappedArray, location, index) => {                           
                                                        if (index < DASHBOARD_LIST_LIMIT) { 
                                                            mappedArray.push(
                                                                <div key={location.id} className="card row">
                                                                    <LocationCard location={location} key={location.id} />
                                                                </div>
                                                            );
                                                        }                                                  
                                                        return mappedArray;
                                                    }, [])
                                            }  
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

export default connect(mapStateToProps, mapDispachToProps )(UserDashboard)
