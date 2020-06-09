import 'react-confirm-alert/src/react-confirm-alert.css'; 
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import  MainContainer  from './../layout/MainContainer';
import { confirmAlert } from 'react-confirm-alert';
import BoardCard from './../user/BoardCard';
import {loadUserBoards, deleteUserBoard} from './../../actions/user_board';


const mapStateToProps = state => {
    return { session: state.session, boards : state.user_boards.data }
  }

  const mapDispachToProps = dispatch => {
    return {
        loadBoards: (session, params) => dispatch(loadUserBoards(session, params)),
        deleteBoard: (session, id) => dispatch( deleteUserBoard(session, id) )        
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
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.props.loadBoards(this.props.session, { wheres : {user_id : this.props.session.user.id }, withs : relations.user_board} );
        }
    }

    deleteBoard(id) {
        confirmAlert({
            title: 'Confirm To Delete',
            message: 'Are you sure you want to delete this session?',
            buttons: [
              {
                label: 'Yes',
                onClick: () => {
                    this.props.deleteBoard(this.props.session, id);
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

    render() {
        const { boards } = this.props;
        return (
            <MainContainer>
                <div className="row">
                    <div className="card card-lg mx-auto">
                        <div className="card-title"><h2>Boards
                        <Link to={'board/create'} className="btn btn-sm btn-outline-secondary float-right"> Create New Board</Link>
                        </h2>
                        </div> 
                        <div className="card-text">
                            <div className="table-container" >
                                <div className="row col-md-12">
                                    {boards && boards.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)).map(board =>  
                                        <BoardCard board={board} key={board.id}  className="col-md-3" deleteBoard={this.deleteBoard} viewBoard={this.viewBoard} editBoard={this.editBoard}  />                              
                                        )
                                    }
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </MainContainer>
        )
    }
}
export default connect(mapStateToProps, mapDispachToProps)(BoardIndex)