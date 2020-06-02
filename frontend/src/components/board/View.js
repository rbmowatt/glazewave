import React, { Component } from 'react'
import { connect } from 'react-redux'
import './Board.css'
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import {FormCard} from './../layout/FormCard';
import StarBar from './../layout/StarBar';
import UserBoardRequests from './../../requests/UserBoardRequests';
import SessionRequests from './../../requests/SessionRequests';

const mapStateToProps = state => {
    return { session: state.session, board : state.user_board }
  }

  const mapDispachToProps = dispatch => {
    return {
      loadBoard: (request, props) => dispatch( request.getOne({label : 'LOAD_USER_BOARD', id : props.match.params.id,  withs : ['Board.Manufacturer'], onSuccess : (data)=>{ return { type: "SET_USER_BOARD", payload: data}}})),
      loadSessions: (request, props) => dispatch( request.get({label : 'LOAD_USER_SESSIONS', wheres : {board_id : props.match.params.id,}, withs : [ 'Location', 'SessionImage'], onSuccess : (data)=>{ return { type: "SET_USER_SESSIONS", payload: data}}})),

    };
  };

class BoardView extends Component {
    constructor(props) {
        super(props);
        this.state = { session: [], headers : {} }
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.props.loadBoard(new UserBoardRequests(this.props.session), this.props );
            this.props.loadSessions(new SessionRequests , this.props );
            
            axios.get( apiConfig.host + apiConfig.port + `/api/board/` + this.props.match.params.id, this.props.session.headers).then(data => {
                ((!this.props.session.isAdmin && !data.data[0].isPublic) || data.data.length === 0) ? this.props.history.push('/board') : this.setState({ session: data.data });
            })
            .catch(error=>this.props.history.push('/board'));
        }
        if(this.state.session === [])
        {
            this.props.history.push('/board');
        }
    }

    returnToIndex = e =>
    {
      this.props.history.push('/board');
    }

    render() {
        const { board } = this.props;
        const pic = (board.picture  == null) ? 'no_photo.jpg' : board.picture;
        return (
            <MainContainer>
                <FormCard returnToIndex={this.returnToIndex}>
                    <div className="container">
				        <div className="wrapper row">
                        <div className="details col-md-12">
                                <h3 className="session-title">{board.name}</h3>
                            </div>
                            <div className="preview col-md-6">
                                <div className="preview-pic tab-content">
                                    <div className="tab-pane active" id="pic-1"><img src={"https://umanage-mowatr.s3.amazonaws.com/" + pic } alt="session" /></div>
                                </div>
                            </div>
                            <div className="details col-md-6">
                            <div className="rating">
                                    <StarBar stars={board.rating} />
                                </div>
                                <h5 className="submitted-by">By <span>{board.size}</span></h5>
                                <h5 className="review-no">Rated: {board.rating}/10 </h5>
                                <h5 className="review-no">Manufacturer: {board.Board && board.Board.Manufacturer && board.Board.Manufacturer.name}</h5>
                                <h5 className="review-no">Model: {board.Board && board.Board.model}</h5>
                                
                                <h5 className="review-no">Notes:</h5>
                                <p className="session-description">{ board.notes}</p>
                            </div>
                        </div>
                    </div>
                </FormCard>
            </MainContainer>
        )
    }
}
export default connect(mapStateToProps, mapDispachToProps)(BoardView)