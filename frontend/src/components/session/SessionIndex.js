import "react-confirm-alert/src/react-confirm-alert.css";
import "./../../css/Elastic.css";
import React, { Component } from "react";
import { confirmAlert } from "react-confirm-alert";
import { connect } from "react-redux";
import elasticConfig from './../../config/elastic';
import { esHeaders } from './../../lib/utils/elastic';
import MainContainer from "./../layout/MainContainer";
import SessionCard from "./SessionCard";
import {
  loadUserSessions,
  deleteUserSession,
  UserSessionsCleared,
} from "./../../actions/user_session";
import Create from "./Create";
import Modal from "./../layout/Modal";
import ScopePicker from "./../layout/ScopePicker";
import NearestSpots from "./../reports/surfline/NearestSpots";
import Report from "./../reports/stormglass/Report";
import {
  ReactiveBase,
  MultiList,
  SelectedFilters,
  ReactiveList,
} from "@appbaseio/reactivesearch";

const DEFAULT_SORT = "id_DESC";
const DEFAULT_SHOW = 8;

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
    session: state.session,
    sessions: state.user_sessions.data
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
  user_session: ["UserBoard", "Location", "SessionImage", "SessionData"],
};

class SessionIndex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,//whether modal is showing or not
      selectedSortOrder: DEFAULT_SORT,
      showAll: 0,//whether or not we are showing user + public sessiions
      esFilters: []//an array of filters to be added to any ES queries
    };
    this.deleteSession = this.deleteSession.bind(this);
    this.editSession = this.editSession.bind(this);
    this.viewSession = this.viewSession.bind(this);
    this.showModal = this.showModal.bind(this);
  }

  componentDidMount() {
    //set the initial scope to private
    this.setScope({nextValue : 0});
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
    // There is no edit route or edit component; View is the inline editor.
    this.props.history.push("/session/" + sessionId);
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

  onSortUpdated = (prevQuery, nextQuery) => {
    let sortString = "";
    for (const [key, value] of Object.entries(nextQuery.sort[0])) {
      sortString = `${key}_${value.order}`;
    }
    this.setState({ selectedSortOrder: sortString });
  };

  elasticResultHandler = (e) => {
    const ids = [];
    e.data.forEach((element) => {
      ids.push(element.id);
    });
    if (ids.length) {
      this.props.loadSessions(this.props.session, {
        orderBy: this.state.selectedSortOrder,
        wheres: { in: ids.join(",") },
        withs: relations.user_session,
        limit: DEFAULT_SHOW,
      });
    } else{
      this.props.clearSessions();
    }
  };

  setScope = (e) => {
    const scopes = [{ match: { user_id: this.props.session.user.id } }];
    if (e.nextValue && parseInt(e.nextValue) === 1) {
      const isPublic = { match: { is_public: 1 } };
      scopes.push(isPublic);
    }
    this.setState({ esFilters: scopes, showAll: parseInt(e.nextValue) });
  };

  // Rebuilt inline on every render on purpose: ReactiveSearch re-runs
  // defaultQuery when the prop identity changes, and a stable reference
  // stops a scope switch from retriggering the query.
  scopeQuery = () => {
    return {
      query: {
        bool: { should: this.state.esFilters },
      },
    };
  };

  render() {
    const showModal = this.showModal;

    return (
      <MainContainer>
        <ReactiveBase app={elasticConfig.sessions_index} url={elasticConfig.host} headers={esHeaders()}>
          <div className="gw-index">

            <div className="gw-index-head">
              <div>
                <div className="gw-index-title">Sessions</div>
                <div className="gw-index-meta">EVERY SESSION YOU HAVE LOGGED</div>
              </div>
              <button className="gw-index-create" onClick={this.showModal}>
                Log a session
              </button>
            </div>

            <div className="gw-index-body">

              <div className="gw-index-facets">
                <ScopePicker
                  name="session_scope"
                  value={this.state.showAll}
                  onChange={this.setScope}
                />

                <hr className="gw-rule" />

                <div className="gw-facet-group">
                  <MultiList
                    componentId="board"
                    dataField="board"
                    innerClass={FACET_CLASSES}
                    title="Boards"
                    react={{
                      and: ["locations"],
                    }}
                    defaultQuery={() => this.scopeQuery()}
                  />
                </div>
                <div className="gw-facet-group">
                  <MultiList
                    componentId="locations"
                    dataField="location"
                    title="Locations"
                    innerClass={FACET_CLASSES}
                    react={{
                      and: ["board"],
                    }}
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
                  renderNoResults={function () {
                    return (
                      <div className="gw-index-empty">
                        <div className="gw-index-empty-title">Nothing here yet</div>
                        <div className="gw-index-empty-hint">
                          NO SESSIONS MATCH THIS SCOPE AND THESE FILTERS
                        </div>
                        <div style={{ marginTop: "20px" }}>
                          <button className="gw-btn gw-btn-primary" style={{ width: "auto", padding: "10px 18px" }} onClick={showModal}>
                            Log a session
                          </button>
                        </div>
                      </div>
                    );
                  }}
                  componentId="results"
                  react={{
                    and: ["board", "locations"],
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
                      dataField: "title",
                      sortBy: "asc",
                      label: "Title A->Z",
                    },
                    {
                      dataField: "title",
                      sortBy: "desc",
                      label: "Title Z->A",
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
                      {this.props.sessions &&
                        this.props.sessions.map((session) => (
                          <SessionCard
                            detailed
                            isOwner={session.user_id === this.props.session.user.id}
                            session={session}
                            key={session.id}
                            deleteSession={this.deleteSession}
                            viewSession={this.viewSession}
                            editSession={this.editSession}
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
        <Modal show={this.state.show}>
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
