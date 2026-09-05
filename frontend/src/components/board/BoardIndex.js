import "react-confirm-alert/src/react-confirm-alert.css";
import "./../../css/Elastic.css";
import React, { Component } from "react";
import { connect } from "react-redux";
import MainContainer from "./../layout/MainContainer";
import { confirmAlert } from "react-confirm-alert";
import BoardCard from "./../board/BoardCard";
import {
	loadUserBoards,
	deleteUserBoard,
	UserBoardsCleared,
	UserBoardCreatedCleared,
} from "./../../actions/user_board";
import elasticConfig from './../../config/elastic';
import { esHeaders } from './../../lib/utils/elastic';
import Modal from "./../layout/Modal";
import CreateUserBoard from "./CreateUserBoard";
import ScopePicker from "./../layout/ScopePicker";
import NearestSpots from "./../reports/surfline/NearestSpots";
import Report from "./../reports/stormglass/Report";
import {
	ReactiveBase,
	MultiList,
	SelectedFilters,
	ReactiveList
} from "@appbaseio/reactivesearch";
import { refresh } from './../../lib/utils/cognito';


const DEFAULT_SORT = "created_at_DESC";
const DEFAULT_SHOW = 12;

const FACET_CLASSES = {
	title: "gw-facet-title",
	input: "gw-facet-input",
	list: "gw-facet-list",
	checkbox: "gw-facet-checkbox",
	label: "gw-facet-label",
	count: "gw-facet-count",
};

const mapStateToProps = (state) => {
	return {
		userSession: state.session,
		boards: state.user_boards.data,
	};
};

const mapDispachToProps = (dispatch) => {
	return {
		loadBoards: (userSession, params) =>dispatch(loadUserBoards(userSession, params)),
		deleteBoard: (userSession, id) =>dispatch(deleteUserBoard(userSession, id)),
		clearBoards: () => dispatch(UserBoardsCleared()),
		clearCreatedBoard: () => dispatch(UserBoardCreatedCleared()),
	};
};

const relations = {
	user_board: ["Board.Manufacturer", "UserBoardImage"],
};

class BoardIndex extends Component {
	constructor(props) {
		super(props);
		this.state = {
			show: false,//toggle for modal
			selectedSortOrder: DEFAULT_SORT,
			showAll: 0,//whether we are are showing only user boards or all public boards
			filters: [{ match: { user_id: props.userSession.user.id } }],//a set of default filters to be sent to elastic
			mlVal : []
		};
		this.deleteBoard = this.deleteBoard.bind(this);
		this.editBoard = this.editBoard.bind(this);
		this.viewBoard = this.viewBoard.bind(this);
	}

	componentDidMount() {
		refresh().catch(() => {})
	}

	componentWillUnmount() {
		//lets get rid of the boards in Redux
		this.props.clearBoards();
	}

	deleteBoard(id) {
		confirmAlert({
			title: "Confirm To Delete",
			message: "Are you sure you want to delete this board?",
			buttons: [
				{
					label: "Yes",
					onClick: () => {
						this.props.deleteBoard(this.props.userSession, id);
					},
				},
				{
					label: "No",
					onClick: () => {},
				},
			],
		});
	}

	editBoard(boardId) {
		// There is no edit route or edit component; View is the inline editor.
		this.props.history.push("/board/" + boardId);
	}

	boardCreated = (id) => {
		//new board was created in modal so let's et rid of boards
		this.props.clearCreatedBoard();
		//forward user to new board details page
		this.viewBoard(id);
	};

	//forwards user to board detail page
	viewBoard(boardId) {
		this.props.history.push("/board/" + boardId);
	}

	showModal = () => {
		this.setState({ show: true });
	};

	hideModal = (e = false) => {
		if (e) e.preventDefault();
		this.setState({ show: false });
	};

	/**
	 * Will set some additional filters on elaticsearch
	 */
	setScope = (e) => {
		const scopes = [{ match: { user_id: this.props.userSession.user.id } }]; //we always want to match against user id
		if (parseInt(e.nextValue) === 1) {
			const isPublic = { match: { is_public: 1 } }; //user also wants to see all public boards
			scopes.push(isPublic);
		}
		this.setState({ filters: scopes, showAll: parseInt(e.nextValue), mlVal : [] });
	};

	// Rebuilt inline on every render on purpose: ReactiveSearch re-runs
	// defaultQuery when the prop identity changes, and a stable reference
	// stops a scope switch from retriggering the query.
	scopeQuery = () => {
		return {
			query: {
				bool: { should: this.state.filters },
			},
		};
	};

	/**
	 * We need to keep track of sort order so that when we ask API to hydrrate items
	 * it returns them in the proper order
	 */
	onSortUpdated = (prevQuery, nextQuery) => {
		let sortString = "";
		for (const [key, value] of Object.entries(nextQuery.sort[0])) {
			//we'll only ever have one sort so we can take the first element and parse it
			sortString = `${key}_${value.order}`;
		}
		this.setState({ selectedSortOrder: sortString });
	};

	/**
	 * Gets called everytime elastic updates
	 * we'll take the id's it has returned and ask the api to hydrate them
	 */
	elasticResultHandler = (e) => {
		const ids = [];
		e.data.forEach((element) => {
			ids.push(element.id);
		});
		if (ids.length) {
			this.props.loadBoards(this.props.userSession, {
				orderBy: this.state.selectedSortOrder,
				wheres: { in: ids.join(",") },
				withs: relations.user_board,
				limit: DEFAULT_SHOW,
			});
		} else{
			this.props.clearBoards();
		  }
	};

	render() {
		const showModal = this.showModal;
		return (
			<MainContainer>
				<ReactiveBase app={elasticConfig.user_boards_index} url={elasticConfig.host} headers={esHeaders()}>
					<div className="gw-index">

						<div className="gw-index-head">
							<div>
								<div className="gw-index-title">Boards</div>
								<div className="gw-index-meta">EVERY BOARD IN YOUR QUIVER</div>
							</div>
							<button className="gw-index-create" onClick={this.showModal}>
								Add a board
							</button>
						</div>

						<div className="gw-index-body">

							<div className="gw-index-facets">
								<ScopePicker
									name="board_scope"
									value={this.state.showAll}
									onChange={this.setScope}
								/>

								<hr className="gw-rule" />

								<div className="gw-facet-group">
									<MultiList
										componentId="manufacturers"
										dataField="manufacturer"
										title="Manufacturers"
										innerClass={FACET_CLASSES}
										react={{
											and: ["models"],
											or: ["board_list"]
										}}
										defaultQuery={() => this.scopeQuery()}
									/>
								</div>
								<div className="gw-facet-group">
									<MultiList
										componentId="models"
										dataField="model"
										innerClass={FACET_CLASSES}
										title="Models"
										react={{
											and: ["manufacturers"],
											or: ["board_list"]
										}}
										renderNoResults={() => (
											<div className="gw-index-empty-hint">NO MODELS MATCH</div>
										)}
										defaultQuery={() => this.scopeQuery()}
									/>
								</div>
							</div>

							<div className="gw-index-results">
								<div className="gw-results-bar">
									<div className="gw-chips">
										<SelectedFilters
											innerClass={{
												button: "gw-chip",
												clearAll: "gw-chip-clear",
											}}
										/>
									</div>
								</div>

								<ReactiveList
									componentId="board_list"
									dataField="id"
									onData={this.elasticResultHandler}
									onQueryChange={this.onSortUpdated}
									defaultQuery={() => this.scopeQuery()}
									renderResultStats={function (stats) {
										return (
											<div className="gw-result-stats">
												{stats.numberOfResults} results · sorted by
											</div>
										);
									}}
									react={{
										and: ["models", "manufacturers"],
									}}
									pagination
									size={DEFAULT_SHOW}
									infiniteScroll={true}
									innerClass={{
										resultsInfo: "gw-sort",
										pagination: "gw-paginate",
										sortOptions: "gw-sort-select",
										button: "gw-load-more",
									}}
									renderNoResults={function () {
										return (
											<div className="gw-index-empty">
												<div className="gw-index-empty-title">Nothing here yet</div>
												<div className="gw-index-empty-hint">
													NO BOARDS MATCH THIS SCOPE AND THESE FILTERS
												</div>
												<div style={{ marginTop: "20px" }}>
													<button className="gw-btn gw-btn-primary" style={{ width: "auto", padding: "10px 18px" }} onClick={showModal}>
														Add a board
													</button>
												</div>
											</div>
										);
									}}
									sortOptions={[
										{
											dataField: "id",
											sortBy: "desc",
											label: "Newest To Oldest",
										},
										{
											dataField: "id",
											sortBy: "asc",
											label: "Oldest To Newest",
										},
										{
											dataField: "name",
											sortBy: "asc",
											label: "Name A->Z",
										},
										{
											dataField: "name",
											sortBy: "desc",
											label: "Name Z->A",
										},
										{
											dataField: "rating",
											sortBy: "asc",
											label: "Rating 1-10",
										},
										{
											dataField: "rating",
											sortBy: "desc",
											label: "Rating 10-1",
										},
									]}
									paginationAt="both"
									render={({ data }) => (
										<div className="gw-list">
											{this.props.boards &&
												this.props.boards.map((board) => (
													<BoardCard
														detailed
														board={board}
														key={board.id}
														deleteBoard={this.deleteBoard}
														viewBoard={this.boardCreated}
														editBoard={this.editBoard}
														isOwner={board.user_id === this.props.userSession.user.id}
													/>
												))}
										</div>
									)}
								/>
							</div>

							<div className="gw-index-side">
								<Report />
								<hr className="gw-rule" />
								<NearestSpots />
							</div>

						</div>
					</div>
				</ReactiveBase>
				<Modal show={this.state.show} handleClose={(e) => this.hideModal(e)}>
					<CreateUserBoard
						onSuccess={(e) => this.hideModal(e)}
						onSubmissionComplete={this.viewBoard}
						close={this.hideModal}
					/>
				</Modal>
			</MainContainer>
		);
	}
}
export default connect(mapStateToProps, mapDispachToProps)(BoardIndex);
