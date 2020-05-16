import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

class UserRow extends React.Component {
    render(){
        return (
            <div class="row table-row" key={this.props.user.Username}>
                <div class="col-2">
                {this.props.user.Username}
                </div>
                <div class="col-3">
                {this.props.user.name}
                </div>
                <div class="col-3">
                {this.props.user.email}
                </div>
                <div class="col-3">
                {this.props.user.phone_number}
                </div>
                <div class="col-1 recipe-details">
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