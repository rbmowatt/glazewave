import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

class UserRow extends React.Component {
    render(){
        return (
            <tr key={this.props.user.Username}>
                <td colspan="3" >{this.props.user.Username}</td>
                <td colspan="3" >{this.props.user.name}</td>
                <td colspan="3" >{this.props.user.email}</td>
                <td colspan="2" >{this.props.user.phone_number}</td>
                <td>
                <div className="d-flex justify-content-between align-items-center">
                <div className="btn-group" style={{ marginBottom: "20px" }}>
                        <span><FontAwesomeIcon alt="edit user" style={{ marginLeft:'.1em' , cursor:'pointer'}} size="2x" icon={faEdit} onClick={() => this.props.editUser(this.props.user.Username)} /></span>
                        <span><FontAwesomeIcon  alt="delete user" style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}} size="2x" icon={faTrash} onClick={() => this.props.deleteUser(this.props.user.Username)}  /></span>
                    </div>
                </div>
                </td>
            </tr>
        )
    }
}
export default UserRow;