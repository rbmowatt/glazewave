import * as React from 'react';
import { connect } from 'react-redux'
import  MainContainer  from './../layout/MainContainer';
import { Link } from 'react-router-dom';
import SessionCard from './../session/SessionCard';
import BoardCard from './BoardCard';
import UserRequests from './../../requests/UserRequests';
import UserBoardRequests from './../../requests/UserBoardRequests';
import UserSessionRequests from './../../requests/SessionRequests';
import {UserSessionsLoaded} from './../../actions/user_session';
import {UserBoardsLoaded} from './../../actions/user_board';
import {loadUserd} from './../../actions/user';
import './css/Dashboard.css'
import ProfileCard from './ProfileCard';
import NearestSpots from './../reports/surfline/NearestSpots';
import Report from './../reports/stormglass/Report';


const DASHBOARD_LIST_LIMIT = 3; 
const mapStateToProps = state => {
    return { session: state.session, boards : state.user_boards.data, user_sessions : state.user_sessions.data, locations : state.user.UserLocations }
  }

  const withs = 
  {
    user : [],
    boards : ['Board', 'UserBoardImage'],
    sessions : ['UserBoard', 'SessionImage', 'Location']
  }

  const mapDispachToProps = dispatch => {
    return {
       // loadUser : (request, session) => dispatch( request.getOne({id :session.user.id , withs : withs.user, onSuccess : (data)=>{ return UserLoaded(data)}})),
        loadBoards: (request, session) => dispatch( request.get({wheres : {user_id : session.user.id }, orderBy : 'created_at_DESC', withs : withs.boards, onSuccess : (data)=>{ return UserBoardsLoaded(data)}})),
        loadSessions: (request, session) => dispatch( request.get({wheres : {user_id : session.user.id }, orderBy : 'created_at_DESC', withs : withs.sessions, onSuccess : (data)=>{return UserSessionsLoaded(data)}})),
    };
  };

class UserDashboard extends React.Component{

    componentDidMount() {
        if (this.props.session.isLoggedIn) {
            //this.props.loadUser(new UserRequests(this.props.session), this.props.session );
            this.props.loadBoards(new UserBoardRequests(this.props.session), this.props.session );
            this.props.loadSessions(new UserSessionRequests(this.props.session), this.props.session );
        }
    }
     
    render() {
        const { user_sessions, boards } = this.props;
        return (
           <MainContainer>
                <div className="row">
                    <div className="container card card-lg mx-auto">
                        <div className="card-title">
                        </div>
                        <div className="card-text dashboard-boxes">
                                <div className="container row">
                                    
                                    <div className="col-md-10 row">
                                        <div className="col-md-12"><ProfileCard /></div>
                                        <div className="col-md-6">
                                            <h5>Latest Sessions</h5>
                                            {
                                                user_sessions && user_sessions.reduce((mappedArray, session, index) => {                           
                                                        if (index < DASHBOARD_LIST_LIMIT) { 
                                                            mappedArray.push(
                                                       
                                                                <SessionCard session={session} key={session.id} />
                                                              
                                                            );
                                                        }                                                  
                                                        return mappedArray;
                                                    }, [])
                                            }
                                        </div>
                                        <div className="col-md-6">
                                        <h5>Newest Boards</h5>
                                            {
                                                boards && boards.reduce((mappedArray, board, index) => {                           
                                                        if (index < DASHBOARD_LIST_LIMIT) { 
                                                            mappedArray.push(
                                                                <BoardCard board={board} key={board.id}/>
                                                            );
                                                        }                                                  
                                                        return mappedArray;
                                                    }, [])
                                            }                              
                                        </div>
                                </div>
                                <div className="col-md-2">
                                    <div className="index-sidecard"><Report/></div>
                                    <div className="index-sidecard"><NearestSpots /></div>
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

// <link href="//www.surf-forecast.com/stylesheets/feed.css" media="screen" rel="stylesheet" type="text/css" /><div id="wf-weatherfeed"><iframe  allowtransparency="true" height="272" width="469" src="//www.surf-forecast.com/breaks/Hollyoake/forecasts/feed/a" scrolling="no" frameborder="0" marginwidth="0" marginheight="0"><p>Your browser does not support iframes.</p></iframe><div id="wf-link"><a href="https://www.surf-forecast.com/"><img alt="Surf Forecast" src="//www.surf-forecast.com/images/feed/surflogo-150.jpg"/></a><p id="cmt">View detailed surf forecast for <a href="//www.surf-forecast.com/breaks/Hollyoake">Hollyoake</a>. Visit <a href="//www.surf-forecast.com/breaks/Hollyoake">surf-forecast.com</a> for more details, long range forecasts, surf reports, swell and weather maps.</p><div></div></div></div>
                                  