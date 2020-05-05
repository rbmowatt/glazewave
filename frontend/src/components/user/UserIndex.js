import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.json';

const mapStateToProps = state => {
    return { session: state.session }
  }

class UserIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { users: [] }
    }

    componentDidMount(){

        if (this.props.session.isLoggedIn) {
            //console.log('token', this.props.session.credentials.accessToken);
            // Call the API server GET /users endpoint with our JWT access token
            const options = {
              headers: {
                Authorization: `Bearer ${this.props.session.credentials.accessToken}`
              }
            };
            axios.get( apiConfig.host + ':' + apiConfig.port + `/user`, options).then(data => {
                console.log('cognito response', data.Users);
                this.setState({ users: data.data })
            });
        }
    }

    deleteCustomer(id ) {
        axios.delete(apiConfig.host + ':' + apiConfig.port + `/users/${id}`).then(data => {
            const index = this.state.users.findIndex(user => user.id === id);
            this.state.users.splice(index, 1);
            this.props.history.push('/');
        })
    }

    render() {
        const users = this.state.users;
        return (
            <div>
                {users.length === 0 && (
                    <div className="text-center">
                        <h2>No user found at the moment</h2>
                    </div>
                )}
                <div className="container">
                    <div className="row">
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
                                    <tr key={user.email}>
                                        <td>{user.Username}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.phone_number}</td>
                                        <td>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="btn-group" style={{ marginBottom: "20px" }}>
                                                    <Link to={`edit/${user.id}`} className="btn btn-sm btn-outline-secondary">Edit Customer </Link>
                                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => this.deleteCustomer(user.id)}>Delete Customer</button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        )
    }
}
export default connect(mapStateToProps)(UserIndex)