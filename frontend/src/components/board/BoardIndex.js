import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import BoardRow from './BoardRow';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css


const mapStateToProps = state => {
    return { session: state.session }
  }

class BoardIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { boards: [], headers : {}, isAdmin : false }
        this.deleteBoard = this.deleteBoard.bind(this);
        this.editBoard = this.editBoard.bind(this);
        this.viewBoard = this.viewBoard.bind(this);
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.setState({ isAdmin : this.props.session.isAdmin });
            const headers = { headers: { Authorization: `Bearer ${this.props.session.credentials.accessToken}`}};
            this.setState({headers});
            axios.get( apiConfig.host + apiConfig.port + `/api/board`, headers).then(data => {
                data.data.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
                this.setState({ boards: data.data })
            });
        }
    }

    deleteBoard(id ) {
        confirmAlert({
            title: 'Confirm To Delete',
            message: 'Are you sure you want to delete this session?',
            buttons: [
              {
                label: 'Yes',
                onClick: () => {
                    axios.delete(apiConfig.host + apiConfig.port + `/api/board/${id}`, this.state.headers).then(data => {
                        const index = this.state.boards.findIndex(board => board.id === id);
                        this.state.boards.splice(index, 1);
                        this.props.history.push('/board');
                    })
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
        const boards = this.state.boards;
        return (
            <MainContainer>
                <div className="row">
                    <div className="card mx-auto">
                        <div className="card-title"><h2>Boards
                        { this.state.isAdmin &&  <Link to={'board/create'} className="btn btn-sm btn-outline-secondary float-right"> Create New Board</Link>}
                        </h2>
                        </div> 
                        <div className="card-text">
                            <div className="table-container" >
                                <div className="row table-header">
                                    <div className="col-6">
                                         Name
                                    </div>
                                    <div className="col-3">
                                        Date
                                    </div>
                                    <div className="col-3">
                                        Location
                                    </div>
                                </div>
                                {boards && boards.map(board =>
                                (this.state.isAdmin || board.isPublic) &&
                                    <BoardRow board={board} deleteBoard={this.deleteBoard} viewBoard={this.viewBoard} editBoard={this.editBoard} isAdmin={this.state.isAdmin} key={ board.id }/>
                                )
                                }
                                {
                                    (!boards  || boards.length === 0) &&  <div className="col-12"><h3>No boards found at the moment</h3></div>
                                } 
                             </div>
                        </div>
                    </div>
                </div>
            </MainContainer>
          
        )
    }
}
export default connect(mapStateToProps)(BoardIndex)