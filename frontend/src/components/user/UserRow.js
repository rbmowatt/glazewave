import React from 'react';
import { Link } from 'react-router-dom';

class UserRow extends React.Component {
    render(){
        return (
            <tr key={this.props.user.Username}>
                <td>{this.props.user.Username}</td>
                <td>{this.props.user.name}</td>
                <td>{this.props.user.email}</td>
                <td>{this.props.user.phone_number}</td>
                <td>
                    <div className="">
                        <div className="btn-group" style={{ marginBottom: "20px" }}>
                            <Link to={`user/edit/${this.props.user.Username}`} className="btn btn-sm btn-outline-secondary">Edit User</Link>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => this.props.deleteUser(this.props.user.Username)}>Delete User</button>
                        </div>
                    </div>
                </td>
            </tr>
        )
    }
}
export default UserRow;