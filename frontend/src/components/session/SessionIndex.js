import 'react-confirm-alert/src/react-confirm-alert.css'; 
import React, { Component } from 'react'
import { confirmAlert } from 'react-confirm-alert';
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import  MainContainer  from './../layout/MainContainer';
import SessionCard from './SessionCard';
import {loadUserSessions, deleteUserSession} from './../../actions/user_session';
import Paginate from './../layout/Paginate';
import Create from './Create';
import Modal from './../layout/Modal';
import { Select} from 'react-advanced-form-addons';
import { Form } from 'react-advanced-form';
import { InstantSearch, SearchBox, Hits, RefinementList , ClearRefinements} from 'react-instantsearch-dom';
import searchClient from './../../lib/utils/algolia'


const DEFAULT_SORT = "created_at_DESC";

const mapStateToProps = state => {
    return { session: state.session, sessions : state.user_sessions.data, api : state.api }
}

const mapDispachToProps = dispatch => {
    return {
        loadSessions: (session, params) => dispatch( loadUserSessions(session, params)), 
        deleteSession: (session, id) => dispatch( deleteUserSession(session, id))
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
            selectedSortOrder : DEFAULT_SORT  
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
        this.props.history.push('/session/' + sessionId);
    }

   
    showModal = () => {
        this.setState({ show: true });
      
    };

    hideModal = (e = false) => {
        if(e) e.preventDefault();
        this.setState({ show: false });
    };

    sortSessions = (e) =>{
       if(e.nextValue)
       {
        this.props.loadSessions(this.props.session, { orderBy : e.nextValue,  wheres : {user_id : this.props.session.user.id }, withs : relations.user_session } );
        this.setState({ selectedSortOrder: e.nextValue});
       }
    }


   hit = ({hit}) => {
    return <div className = "hit">
                <div className = "hitImage" onClick={()=>this.viewSession(hit.id)}>
                    {hit.title}
                </div>
            </div> 
   }

    render() {
        const {sessions} = this.props;
        let pagination =  <Paginate updatePaginationElements={this.updatePaginationElements} data={sessions } currentPage={this.state.currentPage} perPage={8}/>
        return (
            <MainContainer>
                <div className="row">
                    <div className="card card-lg mx-auto">
                        <div className="card-title"><h2>Sessions
                        <Link onClick={this.showModal} className="btn btn-sm btn-outline-secondary float-right"> Create New Session</Link>
                  
                        </h2>
                        </div> 
                        <div className="card-text">
                            <div className="table-container" >
                            <div className="row col-md-12">
                            <div className="col-md-6">
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
                                <div className="col-md-6">
                                    <span className="float-right">
                                        <InstantSearch
                                        indexName="dev_sessions"
                                        searchClient={searchClient}
                                        >
                                         <RefinementList attribute="rating" />
                                        <SearchBox  autoFocus={false} showSubmit={false}/>
                                       
                                        <Hits hitComponent = {this.hit} />
                                       
                                    </InstantSearch>
                                    </span>
                                </div> 

                            </div>
                                <div className="row col-md-12">
                                {this.state.paginatedSessions && this.state.paginatedSessions.map(session =>                        
                                    <SessionCard session={session} key={session.id}  className="col-md-3" deleteSession={this.deleteSession} viewSession={this.viewSession} editSession={this.editSession}  />                              
                                )}
                                {
                                    (!sessions  || sessions.length === 0) &&  
                                    <div className="col-md-12">
                                        <h3>No Sessions found at the moment</h3>
                                    </div>
                                } 
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
                <Modal show={this.state.show} handleClose={(e) =>this.hideModal(e)}>
                        <Create onSuccess={(e) =>this.hideModal(e)} onSubmissionComplete={this.hideModal} />
                    </Modal>
            </MainContainer>
        )
    }
}
export default connect(mapStateToProps, mapDispachToProps)(SessionIndex)