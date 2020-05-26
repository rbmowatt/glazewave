import React from 'react';
import { connect } from 'react-redux';
import BoardRequests from './../../requests/BoardRequests';

const mapStateToProps = state => {
    return { session: state.session }
  }

class UserBoardForm extends React.Component{

    constructor(props ) {
        super(props);
        this.state = {
            boards : []
        }
        this.boardRequest = new BoardRequests(this.props.session);
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.boardRequest.get()
                .then(data => this.setState({boards : data.data}))
                .catch(error=>this.setState({ submitSuccess: false, submitFail: true, errorMessage : error.response.data.message }));
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
                {this.state.boards.map((obj) => {
                     return <option prop={obj.model} value={obj.id}>{obj.model}</option>
                 })}
            </select>
            </label>
        </div>
        <div className="form-group col-md-12">
            <label htmlFor="rating"> What would you rate this Board on a scale of 1-10?
            <select value={this.props.board.rating} onChange={(e) => this.props.handleInputChanges(e)} id="rating" name="rating" className="form-control">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
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

export default connect(mapStateToProps )(UserBoardForm);