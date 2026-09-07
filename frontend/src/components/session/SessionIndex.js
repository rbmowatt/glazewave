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
  updateUserSession,
  UserSessionsCleared,
} from "./../../actions/user_session";
import Create from "./Create";
import Modal from "./../layout/Modal";
import ScopePicker from "./../layout/ScopePicker";
import NearestSpots from "./../reports/surfline/NearestSpots";
import Report from "./../reports/conditions/Report";
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
    updateSession: (session, params) => dispatch(updateUserSession(session, params)),
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
      // /session/create redirects here carrying this flag, so a bookmark or an
      // old link still lands on the create form rather than the bare index.
      show: !!(props.location && props.location.state && props.location.state.createSession),//whether modal is showing or not
      selectedSortOrder: DEFAULT_SORT,
      showAll: 0,//whether or not we are showing user + public sessiions
      esFilters: []//an array of filters to be added to any ES queries
    };
    this.deleteSession = this.deleteSession.bind(this);
    this.editSession = this.editSession.bind(this);
    this.viewSession = this.viewSession.bind(this);
    this.showModal = this.showModal.bind(this);
    this.rateSession = this.rateSession.bind(this);
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

  /*
  The list is rendered from redux, not from the Elasticsearch hit, so the row
  redraws off the PUT response. The reindex the model's afterUpdate hook queues
  is what a later query sees; it is not what updates this row.
  */
  rateSession(id, rating) {
    this.props.updateSession(this.props.session, { id: id, data: { rating: rating } });
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
  Elasticsearch picks which sessions are on the page; MySQL orders them.
  elasticResultHandler hands the hit ids to /api/session and order_by does the
  sorting, so the order a fetch returns is always current. Nothing refetches
  after an inline rating though, and the row would sit in its old slot until
  something else did. Ratings are INTEGER, so this repeats the comparison the
  server just made rather than approximating it.

  Which page a session belongs on still comes from the index, and that is
  roughly a second behind a write. A rating that should jump a session onto
  page one gets there on the next query, not this render.
  */
  sortedSessions = () => {
    const sessions = this.props.sessions || [];
    const order = this.state.selectedSortOrder || DEFAULT_SORT;
    const cut = order.lastIndexOf("_");
    if (cut === -1) return sessions;
    if (order.slice(0, cut) !== "rating") return sessions;
    const direction = order.slice(cut + 1).toLowerCase() === "asc" ? 1 : -1;
    return sessions
      .slice()
      .sort((a, b) => ((Number(a.rating) || 0) - (Number(b.rating) || 0)) * direction);
  };

  render() {
    const showModal = this.showModal;
    const scopeQuery = this.scopeQuery(this.state.esFilters);

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
                    defaultQuery={scopeQuery}
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
                      {this.sortedSessions().map((session) => (
                          <SessionCard
                            detailed
                            isOwner={session.user_id === this.props.session.user.id}
                            session={session}
                            key={session.id}
                            deleteSession={this.deleteSession}
                            viewSession={this.viewSession}
                            editSession={this.editSession}
                            onRate={this.rateSession}
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
