import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import StarBar from './../layout/StarBar';

class SessionRow extends React.Component {
    render(){
        return (
            <div className="row table-row" key={this.props.session.id}>
                <div className="col-6">
                <a href="#" onClick={() => this.props.viewSession(this.props.session.id)}>{this.props.session.title}</a>
                </div>
                <div className="col-3">
                {this.props.session.createdAt}
                </div>
                <div className="col-3 session-details">
                    <div>{!this.props.session.is_public || this.props.session.is_public === "0" ? 'Private' : 'Public'}</div>    
                    <div><StarBar stars={this.props.session.rating} /></div>
                    <div className="edit-delete"> 
                    { this.props.isAdmin && 
                        <FontAwesomeIcon size="lg" alt="edit user" style={{ marginLeft:'.1em' , cursor:'pointer'}}  icon={faEdit} onClick={() => this.props.editSession(this.props.session.id)} />
                    }
                    { this.props.isAdmin && 
                        <FontAwesomeIcon  size="lg"  alt="delete user" style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}}  icon={faTrash} onClick={() => this.props.deleteSession(this.props.session.id)} />
                    }
                    </div>
                </div>
            </div>


        )
    }
}
export default SessionRow;