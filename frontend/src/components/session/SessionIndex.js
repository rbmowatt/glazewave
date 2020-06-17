import 'react-confirm-alert/src/react-confirm-alert.css'; 
import React, { Component } from 'react'
import { confirmAlert } from 'react-confirm-alert';
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import  MainContainer  from './../layout/MainContainer';
import SessionCard from './SessionCard';
import {loadUserSessions, deleteUserSession, UserSessionsCleared } from './../../actions/user_session';
import Paginate from './../layout/Paginate';
import Create from './Create';
import Modal from './../layout/Modal';
import { Select} from 'react-advanced-form-addons';
import { Form } from 'react-advanced-form';
import Facets from './Facets';
import { InstantSearch ,   CurrentRefinements } from 'react-instantsearch-dom';
import searchClient from './../../lib/utils/algolia'


const DEFAULT_SORT = "created_at_DESC";


const mapStateToProps = state => {
    return { session: state.session, sessions : state.user_sessions.data, api : state.api }
}

const mapDispachToProps = dispatch => {
    return {
        loadSessions: (session, params) => dispatch( loadUserSessions(session, params)), 
        deleteSession: (session, id) => dispatch( deleteUserSession(session, id)),
        clearSessions : ()=>dispatch(UserSessionsCleared())
    };
};

const relations = {
    user_session : ['UserBoard', 'Location', 'SessionImage']
};

class SessionIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            sessions: [], 
            //this will recieve the paginated sessions from the child
            paginatedSessions: [],
            currentPage: 0,
            show : false,
            selectedSortOrder : DEFAULT_SORT,
            currentHits : []  
        }
        this.deleteSession = this.deleteSession.bind(this);
        this.editSession = this.editSession.bind(this);
        this.viewSession = this.viewSession.bind(this);
    }

    updatePaginationElements = (paginatedSessions, currentPage)=>
    {
        this.setState({ paginatedSessions: paginatedSessions, currentPage : currentPage});
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.props.loadSessions(this.props.session, { orderBy : DEFAULT_SORT ,  wheres : {user_id : this.props.session.user.id }, withs : relations.user_session } );
        }
    }

    componentWillUnmount(){
        this.props.clearSessions();
    }

    deleteSession(id ) {
        confirmAlert({
            title: 'Confirm To Delete',
            message: 'Are you sure you want to delete this session?',
            buttons: [
              {
                label: 'Yes',
                onClick: () => {
                    this.props.deleteSession(this.props.session, id);
                }
              },
              {
                label: 'No',
                onClick: () => {}
              }
            ]
          });
    }

    editSession(sessionId) {
        this.props.history.push('/session/edit/' + sessionId);
    }

    viewSession(sessionId) {
        console.log('loading session', sessionId)
        this.props.history.push('/session/' + sessionId);
    }

    showModal = () => {
        this.setState({ show: true });
    };

    hideModal = (e = false) => {
        this.setState({ show: false });
    };

    sortSessions = (e) =>{
       if(e.nextValue)
       {
        this.props.loadSessions(this.props.session, { orderBy : e.nextValue,  wheres : {user_id : this.props.session.user.id, in : this.state.currentHits.join(',') }, withs : relations.user_session } );
        this.setState({ selectedSortOrder: e.nextValue});
       }
    }

   searchResultHandler = (e)=>
   {
        var isNew  = JSON.stringify(e) !== JSON.stringify(this.state.currentHits)
        if(e.length && isNew) 
        {
            this.props.loadSessions(this.props.session, {  orderBy : this.state.selectedSortOrder, wheres : {in : e.join(',') }, withs : relations.user_session } );
            this.setState({currentHits : e})
        } 
   }

   onSearch = (e)=>
   {
       console.log('onSearch', e);
   }

    render() {
        const {sessions} = this.props;
        let pagination =  <Paginate updatePaginationElements={this.updatePaginationElements} data={sessions} currentPage={this.state.currentPage} perPage={8}/>
        return (
            <MainContainer>
                <InstantSearch
                    key="is1"
                    indexName="sessions"
                    searchClient={searchClient}
                >
                    <div className="row">
                        <div className="container card card-lg mx-auto">
                            <div className="card-title"><h2>Sessions
                            <Link to="#" onClick={this.showModal} className="btn btn-sm btn-outline-secondary float-right"> Create New Session</Link>
                            </h2>
                            </div> 
                            <div className="card-text">
                                <div className="container" >
                                <div className="row col-md-12">
                                <div className="col-md-2">
                                    <Form key="session_index_board_id">
                                        <Select name="board_id" value={this.state.selectedSortOrder}  onChange={this.sortSessions}>
                                            <option value="created_at_DESC"  >Newest</option>
                                            <option value="created_at_ASC">Oldest</option>
                                            <option value="title_DESC">Title A-Z</option>
                                            <option value="title_ASC" >Title Z-A</option>
                                            <option value="rating_DESC">Rating Best to Worst</option>
                                            <option value="rating_ASC">Rating Worst To Best</option>
                                        </Select>
                                    </Form>
                                    </div> 
                                    <div className="col-md-5">
                                    <CurrentRefinements />
                                    </div>
                                    <div className="col-md-5">
                                        <span className="float-right">
                                        {pagination}
                                        </span>
                                    </div> 
                                </div>
                                <div className="row col-md-12">
                                    <div className="col-2">
                                        <div className="filter-widgets" id="sessions">
                                            <Facets onSelect={this.searchResultHandler} key="sr1" />
                                        </div>
                                    </div>
                                    <div className="col-8">
                                        <div className="row col-md-12">
                                            
                                            {this.state.paginatedSessions && this.state.paginatedSessions.map(session =>    
                                                <div key={session.id} className="container card">                    
                                                <SessionCard session={session} key={session.id}  className="row col-md-12" deleteSession={this.deleteSession} viewSession={this.viewSession} editSession={this.editSession}  />       
                                                </div>                       
                                            )}
                                            {
                                            (!sessions  || sessions.length === 0) &&  
                                                <div className="col-md-12">
                                                    <h3>No Sessions found at the moment</h3>
                                                </div>
                                            } 
                                        </div>
                                    </div>
                                    <div className="col-2">
                                        <div className="col-md-12 filter-widgets" id="sessions">
                                        </div>
                                    </div>
                                </div>
                                <div className="row col-md-12">
                                    <div className="col-md-6">
                                        
                                    </div> 
                                    <div className="col-md-6">
                                        <span className="float-right">
                                        {pagination}
                                        </span>
                                    </div> 
                                </div> 
                            </div>
                        </div>
                    </div>
                </div>
                </InstantSearch>
                <Modal show={this.state.show} handleClose={(e) =>this.hideModal(e)}>
                        <Create onSuccess={(e) =>this.hideModal(e)} onSubmissionComplete={this.viewSession} close={this.hideModal}  />
                </Modal>
            </MainContainer>
        )
    }
}
export default connect(mapStateToProps, mapDispachToProps)(SessionIndex)

/**
 *        <div className="row col-md-12 filter-widgets" id="sessions">
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