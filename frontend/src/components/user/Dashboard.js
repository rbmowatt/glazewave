import * as React from 'react';
import { connect } from 'react-redux'
import { MainContainer } from './../layout/MainContainer';
import { Link } from 'react-router-dom';
import SessionCard from './SessionCard';
import BoardCard from './BoardCard';
import LocationCard from './LocationCard';
import UserRequests from './../../requests/UserRequests';
import UserBoardRequests from './../../requests/UserBoardRequests';
import UserSessionRequests from './../../requests/SessionRequests';

const mapStateToProps = state => {
    return { session: state.session, boards : state.user_boards, user_sessions : state.user_sessions }
  }

  const mapDispachToProps = dispatch => {
    return {
      onUserBoardLoad: (data) => dispatch({ type: "SET_USER_BOARDS", payload: data}),
      onUserSessionLoad: (data) => dispatch({ type: "SET_USER_SESSIONS", payload: data})
    };
  };

class UserDashboard extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            user: {},
            locations: []
        }
        this.userRequest = new UserRequests(this.props.session);
        this.userBoardRequest = new UserBoardRequests(this.props.session);
        this.userSessionRequest = new UserSessionRequests(this.props.session);
    }

    componentDidMount() {
        if (this.props.session.isLoggedIn) {
            this.userRequest.getOne(this.props.session.user.id , ['UserBoard', 'Session.SessionImage','UserLocation'])
            .then(data => {
                this.setState({ user: data.data, locations: data.data.UserLocations, sessions: data.data.Sessions });
            })
            .catch(error=>console.log(error));

            this.userBoardRequest.get({user_id : this.props.session.user.id }, ['Board']).then(data=>{
                //this.setState( { boards : data.data } )
                this.props.onUserBoardLoad(data.data);
            })

            this.userSessionRequest.get({user_id : this.props.session.user.id }, ['Board', 'Location']).then(data=>{
                //this.setState( { boards : data.data } )
                this.props.onUserSessionLoad(data.data);
            })
        }
    }


    render() {
        console.log('sessions', this.state.sessions);
        const {locations } = this.state;
        const { user_sessions, boards } = this.props;
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
                                                {user_sessions && user_sessions.map(session =>
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

export default connect(mapStateToProps, mapDispachToProps )(UserDashboard)
