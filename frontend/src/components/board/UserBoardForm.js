import React from 'react';
import { connect } from 'react-redux';
import BoardRequests from './../../requests/BoardRequests';

const mapStateToProps = state => {
    return { session: state.session, boards: state.boards }
  }

  const mapDispachToProps = dispatch => {
    return {
       loadBoards: (request, session) => dispatch( request.get({label : 'LOAD_BOARDS',   withs : ['Manufacturer'], onSuccess : (data)=>{ return {type: "SET_BOARDS", payload: data}}})),
    };
  };

class UserBoardForm extends React.Component{

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            if(!this.props.boards.length) this.props.loadBoards(new BoardRequests(this.props.session), this.props.session );
        } else {
                this.props.history.push('/');
        }
    }

    render(){
        return (
            <form className="row" id="create-post-form" onSubmit={this.props.processFormSubmission} noValidate={true}>
            <div className="form-group col-md-12">
                <label htmlFor="model">Name</label>
                <input type="text" id="name" defaultValue={this.props.board.name} onChange={(e) => this.props.handleInputChanges(e)} name="name" className="form-control" placeholder="Give your Board a Nickname" />
            </div>
            <div className="form-group col-md-12">
                <label htmlFor="rating"> Model
                <select  onChange={(e) => this.props.handleInputChanges(e)} id="board_id" name="board_id" className="form-control">
                    {this.props.boards.map((obj) => {
                        return <option key={obj.id} prop={obj.model} value={obj.id}>{obj.model}</option>
                    })}
                </select>
                </label>
            </div>
            <div className="form-group col-md-12">
                <label htmlFor="rating"> What would you rate this Board on a scale of 1-10?
                <select value={this.props.board.rating} onChange={(e) => this.props.handleInputChanges(e)} id="rating" name="rating" className="form-control">
                    {[...Array(11).keys()].map((value, index) => {
                        if(value === 0) return;
                        return  <option key={index} value={value}>{value}</option>
                    })} 
                </select>
                </label>
            </div>
            <div className="form-group col-md-12">
                <label htmlFor="model">Notes</label>
                <input type="text" id="notes" defaultValue={this.props.board.name} onChange={(e) => this.props.handleInputChanges(e)} name="notes" className="form-control" placeholder="Give your Board a Nickname" />
            </div>
            { this.props.children && 
                <div className="form-group col-md-12">
                    { this.props.children }
                </div>
            }
            <div className="form-group col-md-4 pull-right">
                <button className="btn btn-success" type="submit">
                {(this.props.edit) ? ("Edit Board") : ( "Add Board") }
                </button>
            </div>
        </form>
        )
    }
}

export default connect(mapStateToProps, mapDispachToProps  )(UserBoardForm);