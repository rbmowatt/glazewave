import 'react-confirm-alert/src/react-confirm-alert.css'; 
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import  MainContainer  from './../layout/MainContainer';
import { confirmAlert } from 'react-confirm-alert';
import BoardCard from './../user/BoardCard';
import {loadUserBoards, deleteUserBoard, UserBoardsCleared} from './../../actions/user_board';
import Paginate from './../layout/Paginate';
import Modal from './../layout/Modal';
import CreateUserBoard from  './CreateUserBoard';
import { Select} from 'react-advanced-form-addons';
import { Form } from 'react-advanced-form';
import { InstantSearch, SearchBox, CurrentRefinements, ClearRefinements} from 'react-instantsearch-dom';
import searchClient from './../../lib/utils/algolia'
import Facets from './Facets';
import { hasSession } from './../../lib/utils/session';

const DEFAULT_SORT = "created_at_DESC";

const mapStateToProps = state => {
    return { userSession: state.session, boards : state.user_boards.data }
  }

  const mapDispachToProps = dispatch => {
    return {
        loadBoards: (userSession, params) => dispatch(loadUserBoards(userSession, params)),
        deleteBoard: (userSession, id) => dispatch( deleteUserBoard(userSession, id) ) ,
        clearBoards : ()=>dispatch(UserBoardsCleared())       
    };
  };
 
const relations = {
    user_board : ['Board.Manufacturer', 'UserBoardImage']
};

class BoardIndex extends Component {
    constructor(props) {
        super(props);
        this.deleteBoard = this.deleteBoard.bind(this);
        this.editBoard = this.editBoard.bind(this);
        this.viewBoard = this.viewBoard.bind(this);
        this.state = {
            elements: [],
            currentPage: 0,
            show : false,
            selectedSortOrder : DEFAULT_SORT,
            currentHits : []   
          };
    }

    componentDidMount(){
        hasSession();
        if (this.props.userSession.isLoggedIn) {
            this.props.loadBoards(this.props.userSession, { orderBy : DEFAULT_SORT , wheres : {user_id : this.props.userSession.user.id }, withs : relations.user_board} );
        }
    }

    componentWillUnmount(){
        this.props.clearBoards();
    }

    componentDidUpdate(prevProps, prevState, snapshot)
    {
       // ((prevProps.boards.length !== this.props.boards.length) || (this.props.boards.length && !this.state.elements.length)) && this.setElementsForCurrentPage(this.props.boards);
    }

    updatePaginationElements = (elements, currentPage)=>
    {
        this.setState({ elements: elements, currentPage : currentPage});
    }
    
    deleteBoard(id) {
        confirmAlert({
            title: 'Confirm To Delete',
            message: 'Are you sure you want to delete this userSession?',
            buttons: [
              {
                label: 'Yes',
                onClick: () => {
                    this.props.deleteBoard(this.props.userSession, id);
                }
              },
              {
                label: 'No',
                onClick: () => {}
              }
            ]
          });
    }

    editBoard(boardId) {
        this.props.history.push('/board/edit/' + boardId);
    }

    viewBoard(boardId) {
        this.props.history.push('/board/' + boardId);
    }

    showModal = () => {
        this.setState({ show: true });
      
    };

    hideModal = (e = false) => {
        if(e) e.preventDefault();
        this.setState({ show: false });
    };

    sortBoards = (e) =>{
        if(e.nextValue)
        {
         this.props.loadBoards(this.props.userSession,  { orderBy : e.nextValue, wheres : {user_id : this.props.userSession.user.id }, withs : relations.user_board})
         this.setState({ selectedSortOrder: e.nextValue});
        }
     }

     hit = ({hit}) => {
        return <div className = "hit">
                    <div className = "hitImage" onClick={()=>this.viewBoard(hit.id)}>
                        {hit.name}
                    </div>
                </div> 
       }

       searchResultHandler = (e)=>
       {
            var isNew  = JSON.stringify(e) !== JSON.stringify(this.state.currentHits)
            if(e.length && isNew) 
            {
                this.props.loadBoards(this.props.userSession,  { orderBy : e.nextValue, wheres : {in : e.join(',') }, withs : relations.user_board})
                this.setState({currentHits : e})
            } 
       }
   
    render() {
        const { boards } = this.props;
        let pagination =  <Paginate updatePaginationElements={this.updatePaginationElements} data={this.props.boards } currentPage={this.state.currentPage} perPage={8}/>
        return (
            <MainContainer>
                 <InstantSearch
                    indexName="user_boards"
                    searchClient={searchClient}
            >
                <div className="row">
                    <div className="container card card-lg mx-auto">
                        <div className="card-title"><h2>Boards
                        <Link onClick={this.showModal} className="btn btn-sm btn-outline-secondary float-right"> Create New Board</Link>
                        </h2>
                        </div> 
                        <div className="card-text">
                            <div className="container" >
                                <div className="row col-12">
                                    <div className="col-2">
                                        <Form>
                                            <Select name="board_id" value={this.state.selectedSortOrder}  onChange={this.sortBoards}>
                                                <option value="created_at_DESC"  >Newest</option>
                                                <option value="created_at_ASC">Oldest</option>
                                                <option value="name_DESC">Name A-Z</option>
                                                <option value="name_ASC" >Name Z-A</option>
                                                <option value="rating_DESC">Rating Best to Worst</option>
                                                <option value="rating_ASC">Rating Worst To Best</option>
                                            </Select>
                                        </Form>
                                    </div>
                                    <div className="col-10">
                                        <span className="float-right"> 
                                            {pagination}
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
                                            <Facets onSelect={this.searchResultHandler} key="sr1" />
                                        </div>
                                    </div>
                                    <div className="col-7">
                                        <div className="row col-12">
                                            {this.state.elements && this.state.elements.map(board =>  
                                            <div  className="col-md-6 col-sm-12"  ><BoardCard board={board} key={board.id} deleteBoard={this.deleteBoard} viewBoard={this.viewBoard} editBoard={this.editBoard}  />   </div>                          
                                            )
                                            }
                                        </div>
                                    </div>
                                    <div className="col-2">
                                        <div className="col-12 filter-widgets" id="sessions">
                                    </div>
                                </div>
                                </div>
                            <div className="row col-12">
                                <div className="col-6">
                                </div> 
                                <div className="col-6">
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
                    <CreateUserBoard onSuccess={(e) =>this.hideModal(e)} onSubmissionComplete={this.viewBoard} close={this.hideModal} />
            </Modal>  
        </MainContainer>
        )
    }
}
export default connect(mapStateToProps, mapDispachToProps)(BoardIndex)