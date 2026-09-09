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
import CreateSession from "./../session/Create";
import ProfileCard from "./ProfileCard";
import RatingTrend from "./RatingTrend";
import NearestSpots from "./../reports/surfline/NearestSpots";
import Report from "./../reports/conditions/Report";
import LocationPicker from "./../reports/LocationPicker";
import { readViewLocation } from "./../../lib/utils/viewLocation";
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
		this.state = {
			showBoardModal: false,
			showSessionModal: false,
			/*
			 * Modal only toggles a CSS class, so everything inside it stays
			 * mounted for the life of the dashboard and keeps its state. These
			 * are remount keys: bumping one after a create throws the finished
			 * form away, which is the only thing that clears the location,
			 * title, board, conditions and picked photos in one go.
			 *
			 * Bumped on create and not on open, so closing a half-filled form
			 * by accident still does not lose it - the same reason neither of
			 * these modals passes handleClose.
			 */
			sessionFormKey: 0,
			boardFormKey: 0,
			// Read once here rather than in each widget, so the report and the
			// spot list cannot disagree about where they are answering for.
			pin: readViewLocation(),
		};
	}

	setPin = (pin) => {
		this.setState({ pin: pin });
	};

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
		this.setState({
			showBoardModal: false,
			boardFormKey: this.state.boardFormKey + 1,
		});
	};

	showSessionModal = () => {
		this.setState({ showSessionModal: true });
	};

	hideSessionModal = (e = false) => {
		if (e && e.preventDefault) e.preventDefault();
		this.setState({ showSessionModal: false });
	};

	/*
	Create clears user_sessions.created itself before it calls back, so unlike
	the board modal there is nothing left to clean up here. The new session is
	already in user_sessions.data, so LatestSessions repaints on its own.
	*/
	sessionCreated = () => {
		this.setState({
			showSessionModal: false,
			sessionFormKey: this.state.sessionFormKey + 1,
		});
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
							onLogSession={this.showSessionModal}
						/>
					</aside>

					<section className="gw-col gw-col-main">
						<RatingTrend trend={averages.rating_trend} />
						<hr className="gw-rule" />
						<Conditions values={averages} title="Average conditions you surf" />
					</section>

					<aside className="gw-col">
						{/* Both read the pin themselves and subscribe to it, so they
						    behave the same here as on the board and session indexes.
						    Only the picker needs it as a prop, to label its own
						    buttons. */}
						<Report />
						<LocationPicker pin={this.state.pin} onChange={this.setPin} />
						<hr className="gw-rule" />
						<NearestSpots />
					</aside>

					<div className="gw-dashboard-lists">
						<LatestSessions
							sessions={user_sessions}
							limit={DASHBOARD_LIST_LIMIT}
							onLogSession={this.showSessionModal}
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
						key={this.state.boardFormKey}
						onSuccess={this.hideBoardModal}
						onSubmissionComplete={this.boardCreated}
						close={this.hideBoardModal}
					/>
				</Modal>
				{/* No handleClose, matching SessionIndex: the session form is long
				    enough that a stray backdrop click should not throw it away. */}
				<Modal show={this.state.showSessionModal}>
					<CreateSession
						key={this.state.sessionFormKey}
						onSuccess={this.hideSessionModal}
						onSubmissionComplete={this.sessionCreated}
						close={this.hideSessionModal}
					/>
				</Modal>
			</MainContainer>
		);
	}
}

export default connect(mapStateToProps, mapDispachToProps)(UserDashboard);
