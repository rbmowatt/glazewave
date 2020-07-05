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
			select: { id: 0, name: "No Board Selected" },
			selectOptions: [],
			defaultImage:
				"https://image.shutterstock.com/image-vector/please-no-photo-camera-vector-260nw-473234290.jpg",
			board_id: props.board_id,
			selectedBoard: {},
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

	componentDidMount() {
		if (this.props.session.isLoggedIn) {
			this.setState({
				board_id: this.props.board_id,
				selectedBoard: this.props.current_session.UserBoard,
			});
			if (this.props.current_session.board_id)
				this.props.loadBoard(this.props.session, {
					id: this.props.current_session.board_id,
					withs: ["UserBoardImage"],
				});
		}
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if (
			prevProps.current_session.board_id !== this.props.board_id ||
			this.props.board_created !== false
		) {
			const board_id = this.props.board_created
				? this.props.board_created.id
				: this.props.board_id;
			this.props.clearCreatedBoard();
			//this.setState({ board_id : board_id})
			this.props.onChange(board_id);
			this.props.loadBoard(this.props.session, {
				id: board_id,
				withs: ["UserBoardImage"],
			});
		}
	}

	render() {
		const session = this.props.current_session;
		const isOwner =
			this.props.session.user.id === this.props.user_board.user_id;
		const boardImage =
			this.props.user_board &&
			this.props.user_board.UserBoardImages &&
			this.props.user_board.UserBoardImages.length
				? s3Conf.root + this.props.user_board.UserBoardImages[0].name
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
								style={{ cursor: "pointer" }}
								onClick={() =>
									this.props.history.push("/board/" + session.board_id)
								}
								src={boardImage}
							/>
						</div>
						<div className="col-7">
							<div
								className={
									isOwner
										? "board-select board-picker-line row"
										: "board-select-disabled board-picker-line row"
								}
							>
								<InlineEdit
									type={InputType.Select}
									value={this.props.user_board.name || "Select A Board"}
									defaultValue={this.props.user_board.name}
									onChange={this.props.onChange}
									options={this.props.boards}
									valueKey="id"
									labelKey="name"
									className="form-control"
									isDisabled={isOwner ? false : true}
								/>
							</div>

							{this.props.user_board && (
								<div className="board-picker-line">
									<StarBar
										stars={this.props.user_board.rating}
										onClick={this.submitUpdate}
										size="xs"
										static={true}
									/>
								</div>
							)}

							{this.props.user_board && (
								<div className="board-picker-line">
									Size:{this.props.user_board.size}
								</div>
							)}
							{isOwner && (
								<div className="board-picker-line">
									<button
										type="button"
										className="btn btn-outline-primary btn-sm"
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
