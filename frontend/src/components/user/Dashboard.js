import "./css/Dashboard.css";
import * as React from "react";
import { connect } from "react-redux";
import MainContainer from "./../layout/MainContainer";
import UserBoardRequests from "./../../requests/UserBoardRequests";
import UserSessionRequests from "./../../requests/SessionRequests";
import { UserSessionsLoaded } from "./../../actions/user_session";
import {
	UserBoardsLoaded,
	UserBoardCreatedCleared,
} from "./../../actions/user_board";
import Modal from "./../layout/Modal";
import CreateUserBoard from "./../board/CreateUserBoard";
import ProfileCard from "./ProfileCard";
import RatingTrend from "./RatingTrend";
import NearestSpots from "./../reports/surfline/NearestSpots";
import Report from "./../reports/conditions/Report";
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
		clearCreatedBoard: () => dispatch(UserBoardCreatedCleared()),
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

class UserDashboard extends React.Component {
	constructor(props) {
		super(props);
		this.state = { showBoardModal: false };
	}

	showBoardModal = () => {
		this.setState({ showBoardModal: true });
	};

	hideBoardModal = (e = false) => {
		if (e && e.preventDefault) e.preventDefault();
		this.setState({ showBoardModal: false });
	};

	/*
	createUserBoard already pushes the new board into user_boards.data, so
	NewestBoards repaints on its own and the dashboard has nothing to refetch.
	The created flag does have to be cleared: BoardPicker fires onChange off it
	and would reassign a session board the next time one mounts.
	*/
	boardCreated = () => {
		this.props.clearCreatedBoard();
		this.setState({ showBoardModal: false });
	};

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
							spotCount={averages.distinct_spots || 0}
							onAddBoard={this.showBoardModal}
						/>
					</aside>

					<section className="gw-col gw-col-main">
						<RatingTrend trend={averages.rating_trend} />
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
							onAddBoard={this.showBoardModal}
						/>
					</div>
				</div>
				<Modal
					show={this.state.showBoardModal}
					handleClose={this.hideBoardModal}
				>
					<CreateUserBoard
						onSuccess={this.hideBoardModal}
						onSubmissionComplete={this.boardCreated}
						close={this.hideBoardModal}
					/>
				</Modal>
			</MainContainer>
		);
	}
}

export default connect(mapStateToProps, mapDispachToProps)(UserDashboard);
