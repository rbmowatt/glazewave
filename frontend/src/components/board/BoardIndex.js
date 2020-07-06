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
import Modal from "./../layout/Modal";
import CreateUserBoard from "./CreateUserBoard";
import { Radio } from "react-advanced-form-addons";
import { Form } from "react-advanced-form";
import { hasSession } from "./../../lib/utils/session";
import NearestSpots from "./../reports/surfline/NearestSpots";
import Report from "./../reports/stormglass/Report";
import {
	ReactiveBase,
	MultiList,
	SelectedFilters,
	ReactiveList
} from "@appbaseio/reactivesearch";

const DEFAULT_SORT = "created_at_DESC";
const DEFAULT_SHOW = 12;

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
			show: false,
			selectedSortOrder: DEFAULT_SORT,
			showAll: 0,
			filters: [{ match: { user_id: props.userSession.user.id } }],
		};
		this.deleteBoard = this.deleteBoard.bind(this);
		this.editBoard = this.editBoard.bind(this);
		this.viewBoard = this.viewBoard.bind(this);
	}

	componentDidMount() {
		hasSession();
		if (this.props.userSession.isLoggedIn) {
			//this.props.loadBoards(this.props.userSession, { orderBy : DEFAULT_SORT , wheres : {user_id : this.props.userSession.user.id }, withs : relations.user_board} );
		}
	}

	componentWillUnmount() {
		this.props.clearBoards();
	}

	deleteBoard(id) {
		confirmAlert({
			title: "Confirm To Delete",
			message: "Are you sure you want to delete this userSession?",
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
		this.props.history.push("/board/edit/" + boardId);
	}

	boardCreated = (id) => {
		this.props.clearCreatedBoard();
		//foreard user to new board details page
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
		this.setState({ filters: scopes, showAll: parseInt(e.nextValue) });
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
		}
	};

	render() {
		const showModal = this.showModal;
		return (
			<MainContainer>
				<ReactiveBase app="user_boards" url={elasticConfig.host} credentials={elasticConfig.credentials}>
					<div className="row">
						<div className="container card card-lg mx-auto">
							<div className="card-title">
								<h2>
									Boards
									<button
										onClick={this.showModal}
										className="btn btn-sm btn-outline-secondary float-right"
									>
										Create New Board
									</button>
								</h2>
							</div>
							<div className="card-text">
								<div className="container">
									<div className="row col-12">
										<div className="col-2"></div>
										<div className="col-10">
											<span className="float-right"></span>
										</div>
									</div>

									<div className="row col-12">
										<div className="col-12">
											<div className="col-3"></div>
											<div className="col-9">
												<SelectedFilters
													innerClass={{
														button: "btn btn-primary",
													}}
												/>
											</div>
										</div>
										<div className="col-3">
											<div className="detail-line is_public_radio">
												<Form>
													<Radio
														name="is_public"
														label="Mine"
														value="0"
														onChange={this.setScope}
														checked={parseInt(this.state.showAll) === 0}
													/>
													<Radio
														className="is_public_radio"
														name="is_public"
														label="Mine + Public"
														value="1"
														onChange={this.setScope}
														checked={parseInt(this.state.showAll) === 1}
													/>
												</Form>
											</div>
											<div className="filter-widgets" id="sessions">
												<MultiList
													componentId="manufacturers"
													dataField="manufacturer"
													title="Manufacturers"
													innerClass={{
														label: "elastic-facet-label",
													}}
													onError={this.setValues}
													react={{
														and: ["models"],
													}}
													defaultQuery={() => {
														return {
															query: {
																bool: { should: this.state.filters },
															},
														};
													}}
												/>
												<MultiList
													componentId="models"
													dataField="model"
													innerClass={{
														label: "elastic-facet-label",
														input: "form-control",
													}}
													title="Models"
													react={{
														and: ["manufacturers"],
													}}
													defaultQuery={() => {
														return {
															query: {
																bool: { should: this.state.filters },
															},
														};
													}}
												/>
											</div>
										</div>
										<div className="col-7">
											<div className="row">
												<ReactiveList
													dataField="id"
													onData={this.elasticResultHandler}
													onQueryChange={this.onSortUpdated}
													defaultQuery={() => {
														return {
															query: {
																bool: { should: this.state.filters },
															},
														};
													}}
													renderResultStats={function (stats) {
														return (
															<div className="elastic-meta">
																{stats.numberOfResults + " Results Sorted By"}
															</div>
														);
													}}
													className="col-12"
													componentId="results"
													react={{
														and: ["models", "manufacturers"],
													}}
													pagination
													size={DEFAULT_SHOW}
													infiniteScroll={true}
													innerClass={{
														pagination: "elastic-paginate",
														sortOptions: "form-control elastic-sort",
													}}
													renderNoResults={function () {
														return (
														  <div className="alert alert-primary text-center index-empty-resultset">
															  <div>You Haven't Created Any Boards Yet</div>
															  <div><button className="btn btn-sm btn-primary"  onClick={showModal} >Get Started!</button></div>
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
													render={({ data }) =>
														this.props.boards &&
														this.props.boards.map((board) => (
															<div
																key={board.id}
																className="col-md-12 col-sm-12"
															>
																<BoardCard
																	board={board}
																	deleteBoard={this.deleteBoard}
																	viewBoard={this.boardCreated}
																	editBoard={this.editBoard}
																/>
															</div>
														))
													}
												/>
											</div>
										</div>
										<div className="col-2">
											<div className="index-sidecard">
												<img
													className="align-left"
													src="/img/LogoMakr_4GvwRg.png"
													alt="glazewave"
												/>
											</div>
											<div className="index-sidecard">
												<Report />
											</div>
											<div className="index-sidecard">
												<NearestSpots />
											</div>
										</div>
									</div>
									<div className="row col-12">
										<div className="col-6"></div>
										<div className="col-6">
											<span className="float-right"></span>
										</div>
									</div>
								</div>
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
