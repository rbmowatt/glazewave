import "react-confirm-alert/src/react-confirm-alert.css";
import "./../../css/Elastic.css";
import React, { Component } from "react";
import { confirmAlert } from "react-confirm-alert";
import { connect } from "react-redux";
import elasticConfig from './../../config/elastic';
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
import { Radio } from "react-advanced-form-addons";
import { Form } from "react-advanced-form";
import NearestSpots from "./../reports/surfline/NearestSpots";
import Report from "./../reports/stormglass/Report";
import {
  ReactiveBase,
  MultiList,
  SelectedFilters,
  ReactiveList,
  StateProvider,
} from "@appbaseio/reactivesearch";

const DEFAULT_SORT = "id_DESC";
const DEFAULT_SHOW = 8;

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
  user_session: ["UserBoard", "Location", "SessionImage"],
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
    this.props.history.push("/session/edit/" + sessionId);
  }

  viewSession(sessionId) {
    this.props.history.push("/session/" + sessionId);
  }

  showModal = () => {
    console.log('modal launched');
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

  render() {
    const showModal = this.showModal;

    return (
      <MainContainer>
        <ReactiveBase app="sessions" url={elasticConfig.host} credentials={elasticConfig.credentials}>
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
                    <div className="col-2"></div>
                    <div className="col-10">
                      <span className="float-right"></span>
                    </div>
                  </div>

                  <div className="row col-12">
                    <div className="col-12">
                      <div className="col-3"></div>
                      <div className="col-9">
                        <SelectedFilters />
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
                          componentId="board"
                          dataField="board"
                          innerClass={{
                            label: "elastic-facet-label",
                            input: "form-control",
                          }}
                          title="Boards"
                          react={{
                            and: ["locations"],
                          }}
                          defaultQuery={() => {
                            return {
                              query: {
                                bool: { should: this.state.esFilters },
                              },
                            };
                          }}
                        />
                        <MultiList
                          componentId="locations"
                          dataField="location"
                          title="Locations"
                          innerClass={{
                            label: "elastic-facet-label",
                          }}
                          react={{
                            and: ["board"],
                          }}
                          defaultQuery={() => {
                            return {
                              query: {
                                bool: { should: this.state.esFilters },
                              },
                            };
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-7">
                      <div className="row">
                        <ReactiveList
                          onData={this.elasticResultHandler}
                          onQueryChange={this.onSortUpdated}
                          defaultQuery={() => {
                            return {
                              query: {
                                bool: { should: this.state.esFilters },
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
                          renderNoResults={function () {
                            return (
                              <div className="alert alert-primary text-center index-empty-resultset">
                                  <div>You Haven't Created Any Sessions Yet</div>
                                  <div><button className="btn btn-sm btn-primary"  onClick={showModal} >Get Started!</button></div>
                              </div>
                            );
                          }}
                          className="col-12"
                          componentId="results"
                          react={{
                            and: ["board", "locations"],
                          }}
                          pagination
                          size={DEFAULT_SHOW}
                          infiniteScroll={true}
                          innerClass={{
                            pagination: "elastic-paginate",
                            sortOptions: "form-control elastic-sort",
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
                          render={({ data }) =>
                            this.props.sessions &&
                            this.props.sessions.map((session) => (
                              <div key={session.id} className="col-12">
                                <SessionCard
                                  isOwner={session.user_id === this.props.session.user.id}
                                  session={session}
                                  key={session.id}
                                  deleteSession={this.deleteSession}
                                  viewSession={this.viewSession}
                                  editSession={this.editSession}
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

