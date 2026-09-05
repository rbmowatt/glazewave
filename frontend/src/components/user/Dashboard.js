import "./css/Dashboard.css";
import * as React from "react";
import { connect } from "react-redux";
import MainContainer from "./../layout/MainContainer";
import UserBoardRequests from "./../../requests/UserBoardRequests";
import UserSessionRequests from "./../../requests/SessionRequests";
import { UserSessionsLoaded } from "./../../actions/user_session";
import { UserBoardsLoaded } from "./../../actions/user_board";
import ProfileCard from "./ProfileCard";
import RatingTrend from "./RatingTrend";
import NearestSpots from "./../reports/surfline/NearestSpots";
import Report from "./../reports/stormglass/Report";
import Conditions from "./../session/Conditions";
import { LatestSessions } from "./../session/LatestSessions";
import { NewestBoards } from "./../board/NewestBoards";

const DASHBOARD_LIST_LIMIT = 3;

const mapStateToProps = (state) => {
	return {
		session: state.session,
		boards: state.user_boards.data,
		user_sessions: state.user_sessions.data,
		averages: state.user.averages,
		locations: state.user.UserLocations,
	};
};

const withs = {
	user: [],
	boards: ["Board", "UserBoardImage"],
	sessions: ["UserBoard", "SessionImage", "Location"],
};

const mapDispachToProps = (dispatch) => {
	return {
		loadBoards: (request, session) =>
			dispatch(
				request.get({
					wheres: { user_id: session.user.id },
					orderBy: "created_at_DESC",
					withs: withs.boards,
					onSuccess: (data) => {
						return UserBoardsLoaded(data);
					},
				})
			),
		loadSessions: (request, session) =>
			dispatch(
				request.get({
					wheres: { user_id: session.user.id },
					orderBy: "created_at_DESC",
					withs: withs.sessions,
					onSuccess: (data) => {
						return UserSessionsLoaded(data);
					},
				})
			),
	};
};

// Sessions carry their Location through the `withs` above, so the spot count
// is already in the store -- there is no endpoint that returns it.
const distinctSpots = (sessions) =>
	new Set(
		sessions
			.filter((session) => session.Location && session.Location.name)
			.map((session) => session.Location.name.toLowerCase())
	).size;

class UserDashboard extends React.Component {
	componentDidMount() {
		if (this.props.session.isLoggedIn) {
			this.props.loadBoards(
				new UserBoardRequests(this.props.session),
				this.props.session
			);
			this.props.loadSessions(
				new UserSessionRequests(this.props.session),
				this.props.session
			);
		}
	}

	render() {
		const { user_sessions, boards, averages } = this.props;
		return (
			<MainContainer>
				<div className="gw-dashboard">
					<aside className="gw-col">
						<ProfileCard
							boardCount={boards.length}
							spotCount={distinctSpots(user_sessions)}
						/>
					</aside>

					<section className="gw-col gw-col-main">
						<RatingTrend sessions={user_sessions} />
						<hr className="gw-rule" />
						<Conditions values={averages} title="Average conditions you surf" />
					</section>

					<aside className="gw-col">
						<Report />
						<hr className="gw-rule" />
						<NearestSpots />
					</aside>

					<div className="gw-dashboard-lists">
						<LatestSessions
							sessions={user_sessions}
							limit={DASHBOARD_LIST_LIMIT}
						/>
						<NewestBoards
							boards={boards}
							limit={DASHBOARD_LIST_LIMIT}
						/>
					</div>
				</div>
			</MainContainer>
		);
	}
}

export default connect(mapStateToProps, mapDispachToProps)(UserDashboard);
