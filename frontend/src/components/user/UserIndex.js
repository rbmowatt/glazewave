import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.js';

const mapStateToProps = state => {
    return { session: state.session }
  }

class UserIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { users: [], headers : {} }
    }

    componentDidMount(){

        if (this.props.session.isLoggedIn) {
            const headers = { headers: { Authorization: `Bearer ${this.props.session.credentials.accessToken}`}};
            this.setState({ headers});
            
            axios.get( apiConfig.host + apiConfig.port + `/api/user`, headers).then(data => {
                this.setState({ users: data.data })
            });
        }
    }

    deleteCustomer(id ) {
        axios.delete(apiConfig.host + apiConfig.port + `/user/${id}`, this.state.headers).then(data => {
            const index = this.state.users.findIndex(user => user.id === id);
            this.state.users.splice(index, 1);
            this.props.history.push('/api/user');
        })
    }

    render() {
        const users = this.state.users;
        return (
            <div className="main-container">
                <div className="container">
                    <div className="row mx-auto">
                    <div className="card um-main-body mx-auto">

                        <div className="card-block">
                        <div className="card-title"><strong>Users</strong> <Link to={'user/create'} className="btn btn-sm btn-outline-secondary float-right"> Create New User</Link></div>
                        <div className="card-text">
                        {users.length === 0 ?(
                            <div className="text-center">
                                <h2>No users found at the moment</h2>
                            </div>
                        ) :(
                        <table className="table table-bordered">
                            <thead className="thead-light">
                                <tr>
                                    <th scope="col">Username</th>
                                    <th scope="col">first_name</th>
                                    <th scope="col">Email</th>
                                    <th scope="col">Phone</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users && users.map(user =>
                                    <tr key={user.Username}>
                                        <td>{user.Username}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.phone_number}</td>
                                        <td>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="btn-group" style={{ marginBottom: "20px" }}>
                                                    <Link to={`user/edit/${user.Username}`} className="btn btn-sm btn-outline-secondary">Edit User</Link>
                                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => this.deleteCustomer(user.Username)}>Delete User</button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>)}
                        </div>
                        </div>
                    </div>
                 </div>
     

            </div>
            </div>
        )
    }
}
export default connect(mapStateToProps)(UserIndex)