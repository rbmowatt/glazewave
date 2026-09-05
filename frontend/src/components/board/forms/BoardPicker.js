import "./../css/BoardPicker.css";
import * as React from "react";
import { connect } from "react-redux";
import InlineEdit, { InputType } from "riec";
import {
	loadUserBoard,
	UserBoardCreatedCleared,
} from "./../../../actions/user_board";
import { s3Conf } from "./../../../config/s3";
import Modal from "./../../layout/Modal";
import CreateUserBoard from "./../CreateUserBoard";
import StarBar from "./../../layout/StarBar";
import { withRouter } from "react-router-dom";

const mapStateToProps = (state) => {
	return {
		session: state.session,
		current_session: state.user_sessions.selected,
		board_created: state.user_boards.created,
		user_board: state.user_boards.selected,
	};
};

const mapDispachToProps = (dispatch) => {
	return {
		loadBoard: (session, params) => dispatch(loadUserBoard(session, params)),
		clearCreatedBoard: () => dispatch(UserBoardCreatedCleared()),
	};
};

class BoardPicker extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			defaultImage: "/img/board_default_lg.png",
			requestedId: null,
			show: false,
		};
		this.hideModal = this.hideModal.bind(this);
		this.showModal = this.showModal.bind(this);
	}

	showModal = () => {
		this.setState({ show: true });
	};

	hideModal = (e = false) => {
		this.setState({ show: false });
	};

	/*
	The session payload already carries the board, because View asks for
	with[]=UserBoard.UserBoardImage and /api/session is not behind
	cognitoAuthMiddleware. /api/user_board is. Reading the board out of the
	session first is what stops a refresh that outruns the Cognito token
	rehydration from 401ing and leaving the picker blank while the rest of the
	page renders fine.

	The store copy still wins when it matches, because a board picked a moment
	ago is only in the store: the PUT response carries the new board_id and no
	association, so session.UserBoard is one board behind until the next load.
	*/
	getBoard = () => {
		const id = Number(this.props.board_id);
		if (!id) return {};

		const fromStore = this.props.user_board;
		if (fromStore && Number(fromStore.id) === id) return fromStore;

		const fromSession = this.props.current_session.UserBoard;
		if (fromSession && Number(fromSession.id) === id) return fromSession;

		return {};
	};

	componentDidUpdate(prevProps, prevState, snapshot) {
		// A board made in the modal exists nowhere else yet, so this is the one
		// case that has to tell the parent to save. The previous version fired
		// onChange on every load as well, which PUT the session back to the value
		// it already held and reindexed it in Elasticsearch each time.
		if (this.props.board_created) {
			const created = this.props.board_created;
			this.props.clearCreatedBoard();
			this.props.onChange(created.id);
			return;
		}

		// Only fetch what is not already in hand. On a page load the session
		// payload covers it and this makes no request at all.
		const id = Number(this.props.board_id);
		if (id && !this.getBoard().id && this.state.requestedId !== id) {
			this.setState({ requestedId: id });
			this.props.loadBoard(this.props.session, {
				id: id,
				withs: ["UserBoardImage"],
			});
		}
	}

	render() {
		const session = this.props.current_session;
		const board = this.getBoard();
		// Ownership is a property of the session, not of the board. Reading it
		// off the board meant a session with no board yet reported "not owner"
		// and rendered the picker disabled, so it could never get one.
		const isOwner =
			!!session.user_id &&
			this.props.session.user.id === session.user_id;
		const boardImage =
			board.UserBoardImages && board.UserBoardImages.length
				? s3Conf.root + board.UserBoardImages[0].name
				: this.state.defaultImage;
		return (
			<div className={this.props.wrapperClass + " "}>
				<div className="container">
					<div className="row">
						<div className="col-12">
							<strong>Board:</strong>
						</div>

						<div className="col-5">
							<img
								style={{ cursor: board.id ? "pointer" : "default" }}
								onClick={() =>
									board.id && this.props.history.push("/board/" + board.id)
								}
								src={boardImage}
								alt={board.name || "No board selected"}
							/>
						</div>
						<div className="col-7">
							<div
								className={
									isOwner
										? "board-select row"
										: "board-select-disabled row"
								}
							>
								<InlineEdit
									type={InputType.Select}
									value={board.name || "Select A Board"}
									defaultValue={board.name}
									onChange={this.props.onChange}
									options={this.props.boards}
									valueKey="id"
									labelKey="name"
									editClass="form-control"
								/>
							</div>

							{board.id && (
								<div className="board-picker-line">
									<StarBar
										stars={board.rating}
										onClick={this.submitUpdate}
										size="xs"
										static={true}
									/>
								</div>
							)}

							{board.id && (
								<div className="board-picker-line">
									Size:{board.size}
								</div>
							)}
							{isOwner && (
								<div className="board-picker-line">
									<button
										type="button"
										className="btn btn-link"
										onClick={this.showModal}
									>
										New Board
									</button>
								</div>
							)}
						</div>
						<Modal show={this.state.show}>
							<CreateUserBoard
								onSuccess={(e) => this.hideModal(e)}
								onSubmissionComplete={this.hideModal}
								close={this.hideModal}
							/>
						</Modal>
					</div>
				</div>
			</div>
		);
	}
}

export default connect(
	mapStateToProps,
	mapDispachToProps
)(withRouter(BoardPicker));
