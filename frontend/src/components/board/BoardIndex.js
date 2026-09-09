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
	updateUserBoard,
	UserBoardsCleared,
	UserBoardCreatedCleared,
} from "./../../actions/user_board";
import { loadBoardRatings } from "./../../actions/board_rating";
import { isReadOnly } from "./../../lib/utils/demo";
import elasticConfig from './../../config/elastic';
import { esHeaders } from './../../lib/utils/elastic';
import Modal from "./../layout/Modal";
import CreateUserBoard from "./CreateUserBoard";
import ScopePicker from "./../layout/ScopePicker";
import NearestSpots from "./../reports/surfline/NearestSpots";
import Report from "./../reports/conditions/Report";
import {
	ReactiveBase,
	MultiList,
	SelectedFilters,
	ReactiveList
} from "@appbaseio/reactivesearch";
import { refresh } from './../../lib/utils/cognito';
import { scopeFromSearch, searchWithScope } from './../../lib/utils/scope';


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
		boardRatings: state.board_ratings.byBoard,
	};
};

const mapDispachToProps = (dispatch) => {
	return {
		loadBoards: (userSession, params) =>dispatch(loadUserBoards(userSession, params)),
		deleteBoard: (userSession, id) =>dispatch(deleteUserBoard(userSession, id)),
		updateBoard: (userSession, params) => dispatch(updateUserBoard(userSession, params)),
		clearBoards: () => dispatch(UserBoardsCleared()),
		clearCreatedBoard: () => dispatch(UserBoardCreatedCleared()),
		loadRatings: (userSession, ids) => dispatch(loadBoardRatings(userSession, ids)),
	};
};

const relations = {
	user_board: ["Board.Manufacturer", "UserBoardImage", "User"],
};

class BoardIndex extends Component {
	constructor(props) {
		super(props);
		const showAll = scopeFromSearch(props.location && props.location.search);
		this.state = {
			// /board/create redirects here carrying this flag, so a bookmark or an
			// old link still lands on the create form rather than the bare index.
			show: !!(props.location && props.location.state && props.location.state.createBoard),//toggle for modal
			selectedSortOrder: DEFAULT_SORT,
			showAll: showAll,//whether we are are showing only user boards or all public boards
			filters: BoardIndex.scopeFilters(props.userSession.user.id, showAll),//a set of default filters to be sent to elastic
			mlVal : []
		};
		this.deleteBoard = this.deleteBoard.bind(this);
		this.editBoard = this.editBoard.bind(this);
		this.viewBoard = this.viewBoard.bind(this);
		this.rateBoard = this.rateBoard.bind(this);
	}

	/*
	The rating lives on user_boards, so this only ever touches the rider's own
	row. The catalog Board it points at is not in the payload and is never
	written from here.
	*/
	rateBoard(id, rating) {
		this.props.updateBoard(this.props.userSession, { id: id, data: { rating: rating } });
	}

	componentDidMount() {
		refresh().catch(() => {})
	}

	componentDidUpdate() {
		this.loadMissingRatings();
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
	static scopeFilters(userId, showAll) {
		const scopes = [{ match: { user_id: userId } }]; //we always want to match against user id
		if (parseInt(showAll) === 1) {
			scopes.push({ match: { is_public: 1 } }); //user also wants to see all public boards
		}
		return scopes;
	}

	setScope = (e) => {
		const showAll = parseInt(e.nextValue);
		// replace, not push: the scope is a view of this page, not a step back
		// to it. goBack() from a board still lands on the list as it was left.
		this.props.history.replace({
			pathname: this.props.location.pathname,
			search: searchWithScope(this.props.location.search, showAll),
			state: this.props.location.state,
		});
		this.setState({
			filters: BoardIndex.scopeFilters(this.props.userSession.user.id, showAll),
			showAll: showAll,
			mlVal: [],
		});
	};

	// ReactiveSearch decides whether to re-run a component's defaultQuery by
	// calling BOTH the current and the previous props' function and deep-comparing
	// the results. A closure over this.state makes the previous one return today's
	// filters, so a scope switch reads as no change and MultiList never re-queries
	// its aggregation - the facets keep the mine-only buckets. Capture the value.
	scopeQuery = (filters) => () => ({
		query: {
			bool: { should: filters },
		},
	});

	/*
	Elasticsearch picks which boards are on the page; MySQL orders them.
	elasticResultHandler hands the hit ids to /api/user_board and order_by does
	the sorting, so a fetch is always current. Nothing refetches after an inline
	rating though, and the row would sit in its old slot until something else
	did. Ratings are INTEGER, so this repeats the comparison the server just
	made rather than approximating it.

	Which page a board belongs on still comes from the index, which is about a
	second behind a write.
	*/
	sortedBoards = () => {
		const boards = this.props.boards || [];
		const order = this.state.selectedSortOrder || DEFAULT_SORT;
		const cut = order.lastIndexOf("_");
		if (cut === -1) return boards;
		if (order.slice(0, cut) !== "rating") return boards;
		const direction = order.slice(cut + 1).toLowerCase() === "asc" ? 1 : -1;
		return boards
			.slice()
			.sort((a, b) => ((Number(a.rating) || 0) - (Number(b.rating) || 0)) * direction);
	};

	/*
	 * Community scores for whatever page just hydrated.
	 *
	 * Hung off the hydrated rows rather than the elasticsearch hits, because
	 * the index holds user_board ids and these are keyed by the catalog model -
	 * boards.id, reached through user_boards.board_id. Only ids not already in
	 * the store are asked for, so paging back to a page costs nothing.
	 */
	requestedRatings = new Set();

	loadMissingRatings = () => {
		const boards = this.props.boards || [];
		const known = this.props.boardRatings || {};
		// Asked-for, not just known: a failed request never fills the store, and
		// componentDidUpdate would then re-fire it on every render forever.
		const wanted = [...new Set(
			boards
				.map((board) => board.board_id)
				.filter((id) => id && !known[id] && !this.requestedRatings.has(id))
		)];
		if (!wanted.length) return;
		wanted.forEach((id) => this.requestedRatings.add(id));
		this.props.loadRatings(this.props.userSession, wanted);
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
		const scopeQuery = this.scopeQuery(this.state.filters);
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
										defaultQuery={scopeQuery}
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
										defaultQuery={scopeQuery}
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
									defaultQuery={scopeQuery}
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
											{this.sortedBoards().map((board) => (
													<BoardCard
														detailed
														board={board}
														key={board.id}
														deleteBoard={this.deleteBoard}
														viewBoard={this.boardCreated}
														editBoard={this.editBoard}
														isOwner={board.user_id === this.props.userSession.user.id}
														onRate={isReadOnly(this.props.userSession) ? null : this.rateBoard}
														communityRating={(this.props.boardRatings || {})[board.board_id]}
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
