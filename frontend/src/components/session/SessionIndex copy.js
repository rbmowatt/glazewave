import "react-confirm-alert/src/react-confirm-alert.css";
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
import Paginate from "./../layout/Paginate";
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
 // SortBy,
} from "react-instantsearch-dom";
import searchClient from "./../../lib/utils/algolia";
import SortBy from "./../layout/SortBy"  


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
      paginatedSessions: [],
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

  updatePaginationElements = (paginatedSessions, currentPage) => {
    this.setState({
      paginatedSessions: paginatedSessions,
      currentPage: currentPage,
    });
  };

  componentDidMount() {
    if (this.props.session.isLoggedIn) {
      window.geolocator.config({
        language: "en",
        google: {
          version: "3",
          key: "AIzaSyBaaD_720jqJaoIBsQib_N79Q5_iciLRBc",
        },
      });

      var options = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumWait: 10000, // max wait time for desired accuracy
        maximumAge: 0, // disable cache
        desiredAccuracy: 30, // meters
        fallbackToIP: true, // fallback to IP if Geolocation fails or rejected
        addressLookup: true, // requires Google API key if true
        //timezone: true,         // requires Google API key if true
        //  map: "map-canvas",      // interactive map element id (or options object)
        //  staticMap: true         // get a static map image URL (boolean or options object)
      };
      window.geolocator.locate(options, function (err, location) {
        if (err) return console.log("location err", err);
        console.log("location", location);
      });
      //console.log('geo', window.geolocator)
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

  sortSessions = (e) => {
    if (e.nextValue) {
      this.props.loadSessions(this.props.session, {
        orderBy: e.nextValue,
        wheres: {
          user_id: this.props.session.user.id,
          in: this.state.currentHits.join(","),
        },
        withs: relations.user_session,
        page: this.setState.currentPage,
        limit: DEFAULT_SHOW,
      });
      this.setState({ selectedSortOrder: e.nextValue });
    }
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
    let pagination = (
      <Paginate
        updatePaginationElements={this.updatePaginationElements}
        data={sessions}
        currentPage={this.state.currentPage}
        perPage={DEFAULT_SHOW}
      />
    );
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
                            { value: "sessions_rating_asc", label: "Rating asc." },
                            { value: "sessions_rating_desc", label: "Rating desc." },
                          ]}
                          onSortUpdated={this.onSortUpdated}
                        />
                      </div>
                      <div className="col-10">
                        <span className="float-right">{pagination}</span>
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
                        <div className="detail-line">
                          <h6>Show</h6>
                          <Form>
                            <Radio
                              name="is_public"
                              label="Mine"
                              value="0"
                              onChange={this.setScope}
                              checked={parseInt(this.state.showAll) === 0}
                            />
                            <Radio
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
                          />
                        </div>
                      </div>
                      <div className="col-7">
                        <div className="row">
                          {this.props.sessions &&
                            this.props.sessions.map((session) => (
                              <div key={session.id} className="col-12 col-lg-6">
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
                      <div className="col-2">
                        <div className="col-12 filter-widgets" id="sessions">
                          <div className="slwd_btv">
                            <script
                              type="text/javascript"
                              src="http://www.surfline.com/widgets2/widget_output_forecast.cfm?id=2147&layout=v&wid=64915&ftr=1"
                            ></script>
                            <div className="slwd_bx">
                              <a
                                href="http://www.surfline.com"
                                className="slwd_lk"
                              >
                                Surfline
                              </a>{" "}
                              <a
                                href="http://www.surfline.com/surf-forecasts"
                                className="slwd_lk"
                              >
                                Surf Forecasts
                              </a>
                            </div>
                            <div className="slwd_tl"></div>
                            <div className="slwd_tr"></div>
                          </div>
                        </div>
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
