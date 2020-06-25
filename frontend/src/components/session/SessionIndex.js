import "react-confirm-alert/src/react-confirm-alert.css";
import axios from "axios";
import React, { Component } from "react";
import { confirmAlert } from "react-confirm-alert";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import MainContainer from "./../layout/MainContainer";
import SessionCard from "./SessionCard";
import {
  loadUserSessions,
  deleteUserSession,
  UserSessionsCleared,
} from "./../../actions/user_session";
import Create from "./Create";
import Modal from "./../layout/Modal";
import { Select, Radio } from "react-advanced-form-addons";
import { Form } from "react-advanced-form";
import Facets from "./Facets";
import {
  InstantSearch,
  CurrentRefinements,
  ClearRefinements,
  Index,
  Pagination,
  HitsPerPage,
} from "react-instantsearch-dom";
import searchClient from "./../../lib/utils/algolia";
import SortBy from "./../layout/SortBy";
import NearestSpots from './../reports/surfline/NearestSpots';
import Report from './../reports/stormglass/Report';



const DEFAULT_SORT = "created_at_DESC";
const DEFAULT_SHOW = 12;

const mapStateToProps = (state) => {
  return {
    session: state.session,
    sessions: state.user_sessions.data,
    api: state.api,
  };
};

const mapDispachToProps = (dispatch) => {
  return {
    loadSessions: (session, params) => dispatch(loadUserSessions(session, params)),
    deleteSession: (session, id) => dispatch(deleteUserSession(session, id)),
    clearSessions: () => dispatch(UserSessionsCleared()),
  };
};

const relations = {
  user_session: ["UserBoard", "Location", "SessionImage"],
};

class SessionIndex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sessions: [],
      //this will recieve the paginated sessions from the child
      currentPage: 0,
      show: false,
      selectedSortOrder: DEFAULT_SORT,
      currentHits: [],
      showAll: 0,
    };
    this.deleteSession = this.deleteSession.bind(this);
    this.editSession = this.editSession.bind(this);
    this.viewSession = this.viewSession.bind(this);
  }

 
  componentDidMount() {
    if (this.props.session.isLoggedIn) {
      //this.props.loadSessions(this.props.session, { orderBy : DEFAULT_SORT ,  wheres : {user_id : this.props.session.user.id }, withs : relations.user_session } );
    }
  }

  componentWillUnmount() {
    this.props.clearSessions();
  }

  deleteSession(id) {
    confirmAlert({
      title: "Confirm To Delete",
      message: "Are you sure you want to delete this session?",
      buttons: [
        {
          label: "Yes",
          onClick: () => {
            this.props.deleteSession(this.props.session, id);
          },
        },
        {
          label: "No",
          onClick: () => {},
        },
      ],
    });
  }

  editSession(sessionId) {
    this.props.history.push("/session/edit/" + sessionId);
  }

  viewSession(sessionId) {
    this.props.history.push("/session/" + sessionId);
  }

  showModal = () => {
    this.setState({ show: true });
  };

  hideModal = (e = false) => {
    this.setState({ show: false });
  };

  onSortUpdated = (sortOrder)=>{
    let sort = sortOrder.replace('sessions_', '');
    if(sort === 'sessions') sort= 'id_desc';
    this.setState({ selectedSortOrder: sort });
  }

  setScope = (e) => {
    if (e.nextValue) {
      this.setState({ showAll: e.nextValue });
    }
  };

  searchResultHandler = (e) => {
    var isNew = JSON.stringify(e) !== JSON.stringify(this.state.currentHits);
    if (e.length && isNew) {
      this.props.loadSessions(this.props.session, {
        orderBy: this.state.selectedSortOrder,
        wheres: { in: e.join(",") },
        withs: relations.user_session,
        page: this.setState.currentPage,
        limit: DEFAULT_SHOW,
      });
      this.setState({ currentHits: e });
    }
  };

  onSearch = (e) => {
    console.log("onSearch", e);
  };

  render() {
    const { sessions } = this.props;
    return (
      <MainContainer>
        <InstantSearch
          key="is1"
          indexName="sessions"
          searchClient={searchClient}
        >
          <Index indexName="sessions">
            <div className="row">
              <div className="container card card-lg mx-auto">
                <div className="card-title">
                  <h2>
                    Sessions
                    <Link
                      to="#"
                      onClick={this.showModal}
                      className="btn btn-sm btn-outline-secondary float-right"
                    >
                      Create New Session
                    </Link>
                  </h2>
                </div>
                <div className="card-text">
                  <div className="container">
                    <div className="row col-12">
                      <div className="col-2">
                        <SortBy
                          defaultRefinement="sessions"
                          items={[
                            { value: "sessions", label: "Newest To Oldest" },
                            { value: "sessions_id_asc", label: "Oldest To Newest" },
                            { value: "sessions_rating_desc", label: "Best To Worst" },
                            { value: "sessions_rating_asc", label: "Worst To Best" }
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
                          <Facets
                            onSelect={this.searchResultHandler}
                            showAll={this.state.showAll}
                            key="sr1"
                            hitsPerPage={DEFAULT_SHOW}
                          />
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="row">
                          {this.props.sessions &&
                            this.props.sessions.map((session) => (
                              <div key={session.id} className="col-12">
                                <SessionCard
                                  session={session}
                                  key={session.id}
                                  deleteSession={this.deleteSession}
                                  viewSession={this.viewSession}
                                  editSession={this.editSession}
                                />
                              </div>
                            ))}
                          {(!sessions || sessions.length === 0) && (
                            <div className="col-12">
                              <h3>No Sessions found at the moment</h3>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-3">
                            <div className="index-sidecard"><Report/></div>
                            <div className="index-sidecard"><NearestSpots /></div>
                      </div>
                    </div>
                    <div className="row col-12">
                      <div className="col-6"></div>
                      <div className="col-6">
                        <span className="float-right">
                          <HitsPerPage
                            defaultRefinement={DEFAULT_SHOW}
                            items={[{value:12}, {value:20}, {value:50}]}
                          />
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
          <Create
            onSuccess={(e) => this.hideModal(e)}
            onSubmissionComplete={this.viewSession}
            close={this.hideModal}
          />
        </Modal>
      </MainContainer>
    );
  }
}
export default connect(mapStateToProps, mapDispachToProps)(SessionIndex);

/**
 *        <div className="row col-12 filter-widgets" id="sessions">
                                <InstantSearch
                                        indexName="dev_sessions"
                                        searchClient={searchClient}
                                        >
                                        <RefinementList 
                                        container="#sessions"
                                        attribute="rating"
                                        searchableIsAlwaysActive={true} />
                                        <Configure hitsPerPage={8} />
                                    </InstantSearch>
                                </div>
 */
