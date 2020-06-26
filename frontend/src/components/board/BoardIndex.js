import "react-confirm-alert/src/react-confirm-alert.css";
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
import Modal from "./../layout/Modal";
import CreateUserBoard from "./CreateUserBoard";
import {
  InstantSearch,
  CurrentRefinements,
  ClearRefinements,
  Index,
  Pagination,
  HitsPerPage,
} from "react-instantsearch-dom";
import searchClient from "./../../lib/utils/algolia";
import Facets from "./Facets";
import { hasSession } from "./../../lib/utils/session";
import SortBy from "./../layout/SortBy";

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
    loadBoards: (userSession, params) =>
      dispatch(loadUserBoards(userSession, params)),
    deleteBoard: (userSession, id) =>
      dispatch(deleteUserBoard(userSession, id)),
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
      currentPage: 0,
      show: false,
      selectedSortOrder: DEFAULT_SORT,
      currentHits: [],
      showAll: 0
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
    this.viewBoard(id);
  };

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

  onSortUpdated = (sortOrder)=>{
    let sort = sortOrder.replace('user_boards_', '');
    if(sort === 'user_boards') sort= 'id_desc';
    this.setState({ selectedSortOrder: sort });
  }

  sortBoards = (e) => {
    if (e.nextValue) {
      this.props.loadBoards(this.props.userSession, {
        orderBy: e.nextValue,
        wheres: { user_id: this.props.userSession.user.id },
        withs: relations.user_board,
      });
      this.setState({ selectedSortOrder: e.nextValue });
    }
  };


  searchResultHandler = (e) => {
    var isNew = JSON.stringify(e) !== JSON.stringify(this.state.currentHits);
    if (e.length && isNew) {
      this.props.loadBoards(this.props.userSession, {
        orderBy: this.state.selectedSortOrder,
        wheres: { in: e.join(",") },
        withs: relations.user_board,
        page: this.state.currentPage,
        limit: DEFAULT_SHOW,
      });
      this.setState({ currentHits: e });
    }
  };

  render() {
    const { boards } = this.props;
    return (
      <MainContainer>
        <InstantSearch
          key="is2"
          indexName="user_boards"
          searchClient={searchClient}
        >
          <Index indexName="user_boards">
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
                      <div className="col-2">
                        <SortBy
                            defaultRefinement="user_boards_id_desc"
                            items={[
                                { value: "user_boards_id_desc", label: "Newest To Oldest" },
                                { value: "user_boards", label: "Oldest To Newest" },
                                { value: "user_boards_rating_desc", label: "Best To Worst" },
                                { value: "user_boards_rating_asc", label: "Worst To Best" }
                            ]}
                            onSortUpdated={this.onSortUpdated}
                            />
                      </div>
                      <div className="col-10">
                        <span className="float-right">
                          <Pagination />
                        </span>
                      </div>
                    </div>
                    <div className="row col-12">
                      <div className="col-3">
                        <ClearRefinements />
                      </div>
                      <div className="col-9">
                        <CurrentRefinements />
                      </div>
                    </div>
                    <div className="row col-12">
                      <div className="col-3">
                        <div className="filter-widgets" id="sessions">
                          <Facets
                            onSelect={this.searchResultHandler}
                            showAll={this.state.showAll}
                            key="sr2"
                            hitsPerPage={DEFAULT_SHOW}
                          />
                        </div>
                      </div>
                      <div className="col-7">
                        <div className="row col-12">
                          {this.props.boards &&
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
                            ))}
                        </div>
                      </div>
                      <div className="col-2">
                        <div
                          className="col-12 filter-widgets"
                          id="sessions"
                        ></div>
                      </div>
                    </div>
                    <div className="row col-12">
                      <div className="col-6"></div>
                      <div className="col-6">
                        <span className="float-right">
                          <Pagination />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Index>
        </InstantSearch>
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
