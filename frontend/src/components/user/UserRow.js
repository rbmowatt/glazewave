import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

class UserRow extends React.Component {
    render(){
        return (
            <div className="row table-row" key={this.props.user.Username}>
                <div className="col-2">
                {this.props.user.Username}
                </div>
                <div className="col-3">
                {this.props.user.name}
                </div>
                <div className="col-3">
                {this.props.user.email}
                </div>
                <div className="col-3">
                {this.props.user.phone_number}
                </div>
                <div className="col-1 recipe-details">
                    <div>
                        <FontAwesomeIcon alt="edit user" style={{ marginLeft:'.1em' , cursor:'pointer'}}  icon={faEdit} onClick={() => this.props.editUser(this.props.user.Username)} />
                        <FontAwesomeIcon  alt="delete user" style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}}  icon={faTrash} onClick={() => this.props.deleteUser(this.props.user.Username)}  />
                    </div>
                </div>
            </div>
        )
    }
}
export default UserRow;