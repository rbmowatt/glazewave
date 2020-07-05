import "./css/Board.css";

import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FormCard } from "./../layout/FormCard";
import { Form } from "react-advanced-form";
import { RIEInput, RIETextArea } from "@attently/riek";
import SessionCard from "./../session/SessionCard";
import MainContainer from "./../layout/MainContainer";
import StarBar from "./../layout/StarBar";
import UserBoardRequests from "./../../requests/UserBoardRequests";
import ImageUploader from "react-images-upload";
import ImageGallery from "react-image-gallery";
import TypeAheadInput from "./../form/TypeAheadInput";
import { sizes } from "./data/board_sizes";
import InlineEdit, { InputType } from "riec";
import { loadBoards } from "./../../actions/board";
import { loadShapers } from "./../../actions/shaper";
import { loadUserSessions } from "./../../actions/user_session";
import {
	loadUserBoard,
	updateUserBoard,
	loadUserBoardImages,
	addUserBoardImages,
	deleteUserBoardImage,
} from "./../../actions/user_board";

const mapStateToProps = (state) => {
	return {
		session: state.session,
		board: state.user_boards.selected,
		boards: state.boards.data,
		shapers: state.shapers.data,
		images: state.user_board_images,
	};
};

const mapDispachToProps = (dispatch) => {
	return {
		loadBoard: (session, params) => dispatch(loadUserBoard(session, params)),
		loadSessions: (session, params) =>dispatch(loadUserSessions(session, params)),
		loadShapers: (session, params) => dispatch(loadShapers(session, params)),
		loadBoards: (session, params) => dispatch(loadBoards(session, params)),
		editUserBoard: (session, params) =>dispatch(updateUserBoard(session, params)),
		loadBoardImages: (session, params) =>dispatch(loadUserBoardImages(session, params)),
		addImages: (session, params) =>dispatch(addUserBoardImages(session, params)),
		deleteBoardImage: (session, id) =>dispatch(deleteUserBoardImage(session, id)),
	};
};

const relations = {
	user_session: ["Location", "SessionImage"],
	selected_board: [
		"Board.Manufacturer",
		"Session.SessionImage",
		"Session.UserBoard",
	],
	shapers: ["Board"],
	boards: ["Manufacturer"],
};

class BoardView extends Component {
	constructor(props) {
		super(props);
		this.state = {
			session: [],
			board_id: "",
			manufacturer_id: "",
			uploaderInstance: 1,
			imageIndex: 0,
			modelPlaceholder: null,
			boardSizeOptions: this.prepBoardSizeOptions(sizes),
		};
		this.onDrop = this.onDrop.bind(this);
	}

	componentDidMount() {
		if (this.props.session.isLoggedIn) {
			this.props.loadBoard(this.props.session, {
				id: this.props.match.params.id,
				withs: relations.selected_board,
			});
			this.props.loadSessions(this.props.session, {
				wheres: { board_id: this.props.match.params.id },
				withs: relations.user_session,
			});
			this.props.loadBoards(this.props.session, {
				limit: 1000,
				withs: relations.boards,
			});
			this.props.loadShapers(this.props.session, { withs: relations.shapers });
			this.props.loadBoardImages(this.props.session, {
				wheres: { user_board_id: this.props.match.params.id },
			});
		} else this.props.history.push("/board");
	}

	prepBoardSizeOptions = (sizes) => {
		const filteredSizes = [];
		sizes.forEach((size) => filteredSizes.push({ id: size }));
		return filteredSizes;
	};

	onTypeAheadSelected = (propertyName, newValue) => {
		const data = [];
		data[propertyName] = newValue;
		//here we have to make sure to clear out the model if not belong to shaper
		if (propertyName === "manufacturer_id") {
			const boardId = !Number.isInteger(this.state.board_id)
				? this.props.board.id
				: this.state.board_id;
			const board = this.props.boards.find((board) => board.id === boardId);
			if (board && board.manufacturer_id !== newValue) {
				data["board_id"] = "";
				data["modelPlaceholder"] = "Choose A Board";
			}
		}
		this.setState({
			...data,
		});
	};

	getShaperSuggestions = (value, reason) => {
		//if its empty or just focused let's show everything
		if (!value || reason === "type_ahead_focused") return this.props.shapers;

		const inputValue = value.trim().toLowerCase();
		const inputLength = inputValue.length;
		return inputLength === 0
			? []
			: this.props.shapers.filter(
					(entity) =>
						entity.name.toLowerCase().slice(0, inputLength) === inputValue
			  );
	};

	getBoardSuggestions = (value, reason) => {
		//if its empty or just focused let's show everything
		if (!value || reason === "type_ahead_focused") {
			const shaperId =
				this.state.manufacturer_id === ""
					? this.props.board.Board.manufacturer_id
					: this.state.manufacturer_id;
			return this.props.boards.filter(
				(entity) => entity.manufacturer_id === shaperId
			);
		}
		const inputValue = value.trim().toLowerCase();
		const inputLength = inputValue.length;
		return inputLength === 0
			? []
			: this.props.boards.filter(
					(entity) =>
						entity.model.toLowerCase().slice(0, inputLength) === inputValue &&
						entity.manufacturer_id === this.state.manufacturer_id
			  );
	};

	submitUpdate = (data) => {
		this.props.editUserBoard(this.props.session, {
			id: this.props.match.params.id,
			data: data,
		});
		this.setState(data);
	};

	returnToIndex = (e) => {
		this.props.history.length > 1
			? this.props.history.goBack()
			: this.props.history.push("/board");
	};

	onDrop(pictureFiles, pictureDataURLs) {
		if (!pictureFiles.length) return;
		const formData = UserBoardRequests.createFormRequest({
			user_board_id: this.props.board.id,
			user_id: this.props.session.user.id,
		});
		pictureFiles.forEach((file, i) => {
			formData.append("photo", file);
		});
		this.props.addImages(this.props.session, { data: formData });
		this.setState({ uploaderInstance: this.state.uploaderInstance + 1 });
	}

	onImageLoad = (e) => {
		this.setState({ selectedImage: this.props.images[0] });
	};

	onImageSelected = (e) => {
		this.setState({ selectedImage: this.props.images[e], imageIndex: e });
	};

	deleteImage = (e) => {
		new Promise((resolve, reject) => {
			resolve(
				this.props.deleteBoardImage(
					this.props.session,
					this.state.selectedImage.id
				)
			);
		}).then((e) => {
			const newIndex =
				this.state.imageIndex === 0 ? 0 : this.state.imageIndex - 1;
			this.setState({
				imageIndex: newIndex,
				selectedImage: this.props.images[newIndex],
			});
		});
	};


	render() {
		const { board } = this.props;
		const modelPlaceholder = this.state.modelPlaceholder
			? this.state.modelPlaceholder
			: board.Board
			? board.Board.model
			: "Choose A Model";
		return (
			<MainContainer>
				<FormCard returnToIndex={this.returnToIndex}>
					<Form>
						<div className="row col-md-12 container">
							<h2 className="details col-md-12">
								<RIEInput
									required={false}
									value={board.name || ""}
									s
									defaultValue={board.name}
									change={this.submitUpdate}
									propName="name"
								/>
							</h2>
							<div className="preview col-md-6">
								<div className="clearfix">
									<ImageUploader
										key={this.state.uploaderInstance}
										withIcon={false}
										buttonText="Add Images!"
										onChange={this.onDrop}
										imgExtension={[".jpg", ".jpeg", ".gif", ".png", ".gif"]}
										maxFileSize={5242880}
										withPreview={false}
										withLabel={false}
										buttonClassName="btn btn-link"
									/>
								</div>
								<div>
									<ImageGallery
										items={this.props.images}
										showBullets={true}
										showIndex={true}
										startIndex={this.state.imageIndex}
										onSlide={this.onImageSelected}
										showNav={false}
										onImageLoad={this.onImageLoad}
									/>
								</div>
							</div>
							<div className="details col-md-6">
								<div className="detail-line">
									<StarBar
										stars={board.rating}
										onClick={this.submitUpdate}
										size="1x"
									/>
								</div>
								<div className="detail-line">
									<strong>Size:</strong>
									&nbsp;
									<InlineEdit
										type={InputType.Select}
										value={board.size || "Select A Size"}
										onChange={(data) => {
											this.submitUpdate({ size: data });
										}}
										options={this.state.boardSizeOptions}
										valueKey="id"
										labelKey="id"
									/>
								</div>
								<div className="detail-line">
									<div>
										<strong>Shaper/Company:</strong>
									</div>
									<TypeAheadInput
										entity={this.props.shapers}
										name="manufacturer_id"
										keyName="name"
										className="form-control"
										placeholder={
											board.Board && board.Board.Manufacturer
												? board.Board.Manufacturer.name
												: "Choose A Shaper"
										}
										value={this.state.manufacturer_id}
										setValue={this.onTypeAheadSelected}
										getSuggestions={this.getShaperSuggestions}
										display={true}
									/>
								</div>
								<div className="detail-line">
									<div>
										<strong>Model:</strong>
									</div>
									<TypeAheadInput
										entity={this.props.boards}
										name="board_id"
										keyName="model"
										className="form-control"
										placeholder={modelPlaceholder}
										value={this.state.board_id}
										setValue={this.onTypeAheadSelected}
										getSuggestions={this.getBoardSuggestions}
										display={true}
									/>
								</div>
								<div className="detail-line">
									<div>
										<strong>Notes:</strong>
									</div>
									<RIETextArea
										value={board.notes || "You have no notes for this session"}
										defaultValue={board.notes}
										className="form-control text-area"
										change={this.submitUpdate}
										propName="notes"
										validate={_.isString}
									/>
								</div>
							</div>
						</div>
						<div className="container">
							<div className="row col-12" style={{ marginTop: "1em" }}>
								<h5>Used In Sessions...</h5>
							</div>
							<div className="row col-12">
								{board.Sessions &&
									board.Sessions.reduce((mappedArray, session, index) => {
										if (index < 3) {
											mappedArray.push(
												<div className="col-md-4" key={index}>
													<SessionCard session={session} key={session.id} />
												</div>
											);
										}
										return mappedArray;
									}, [])}
								{(!board.Sessions || board.Sessions.length === 0) && (
									<div className="col-12">
										<h3>No Sessions found at the moment</h3>
									</div>
								)}
							</div>
						</div>
					</Form>
				</FormCard>
			</MainContainer>
		);
	}
}
export default connect(mapStateToProps, mapDispachToProps)(BoardView);
