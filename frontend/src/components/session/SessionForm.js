import React from 'react';
import Modal from './../layout/Modal';
import { connect } from 'react-redux';
import CreateUserBoard from  './../board/CreateUserBoard';

const mapStateToProps = state => {
    return { session: state.session }
  }

class SessionForm extends React.Component{
    constructor(props)
    {
        super(props);
        this.state = {show:false}
    }

    showModal = () => {
        this.setState({ show: true });
    };

    hideModal = (e = false) => {
        if(e) e.preventDefault();
        this.setState({ show: false });
    };

    render(){ 
        return (
            <div>
            <form className="row" id="create-post-form" onSubmit={this.props.processFormSubmission} noValidate={true}>
            <div className="form-group col-md-12">
                    <label htmlFor="first_name"> Name/Title </label>
                    <input type="text" id="name" defaultValue={this.props.session.title} onChange={(e) => this.props.handleInputChanges(e)} name="name" className="form-control" placeholder="Session Title" />
            </div>
            <div className="form-group col-md-12">
                <label htmlFor="rating"> What Board Did You Use?
                <select  onChange={(e) => this.props.handleInputChanges(e)} id="board_id" name="board_id" className="form-control">
                    {this.props.boards.map((obj) => {
                        return <option prop={obj.name} value={obj.id}>{obj.name}</option>
                    })}
                </select>
                </label>
                <div> 
                <button type='button' onClick={this.showModal}>Add A Board</button>
                </div>
            </div>
            <div className="form-group col-md-12">
                <label htmlFor="rating"> What would you rate this Session on a scale of 1-10?
                    <select value={this.props.session.rating} onChange={(e) => this.props.handleInputChanges(e)} id="rating" name="rating" className="form-control">
                            {[...Array(11).keys()].map((value, index) => {
                                if(value === 0) return;
                                return  <option value={value}>{value}</option>
                            })}
                    </select>
                </label>
            </div>
            <div className="form-group col-md-12">
            <label htmlFor="isPublic"> Should this Session be Public to ALL logged-in Users?
                <select value={this.props.session.is_public} onChange={(e) => this.props.handleInputChanges(e)} id="is_public" name="is_public" className="form-control">
                <option value="0">Private</option>
                <option value="1">Public</option>
                </select>
                </label>
            </div>
            <div className="form-group col-md-12">
                    <label htmlFor="first_name"> Notes </label>
                    <textarea id="notes" name="notes" className="form-control" onChange={(e) => this.props.handleInputChanges(e)} />
            </div>
            
            { this.props.children && 
                <div className="form-group col-md-12">
                    { this.props.children }
                </div>
            }
            <div className="form-group col-md-4 pull-right">
                <button className="btn btn-success" type="submit">
                {(this.props.edit) ? ("Edit Session") : ( "Add Session") }
                </button>
            </div>
        </form>
        <Modal show={this.state.show} handleClose={(e) =>this.hideModal(e)}>
            <CreateUserBoard onSuccess={(e) =>this.hideModal(e)} />
        </Modal>
        </div>
        )
    }
}

export default connect(mapStateToProps)(SessionForm);