import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import StarBar from './../layout/StarBar';

class BoardRow extends React.Component {
    render(){
        return (
            <div className="row table-row" key={this.props.board.id}>
                <div className="col-6">
                <a href="#" onClick={() => this.props.viewBoard(this.props.board.id)}>{this.props.board.model}</a>
                </div>
                <div className="col-3">
                {this.props.board.createdAt}
                </div>
                <div className="col-3 board-details">
                    <div>{!this.props.board.is_public || this.props.board.is_public === "0" ? 'Private' : 'Public'}</div>    
                    <div><StarBar stars={this.props.board.rating} /></div>
                    <div className="edit-delete"> 
                    { this.props.isAdmin && 
                        <FontAwesomeIcon size="lg" alt="edit user" style={{ marginLeft:'.1em' , cursor:'pointer'}}  icon={faEdit} onClick={() => this.props.editBoard(this.props.board.id)} />
                    }
                    { this.props.isAdmin && 
                        <FontAwesomeIcon  size="lg"  alt="delete user" style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}}  icon={faTrash} onClick={() => this.props.deleteBoard(this.props.board.id)} />
                    }
                    </div>
                </div>
            </div>


        )
    }
}
export default BoardRow;