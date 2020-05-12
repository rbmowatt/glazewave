import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import UserRow from './UserRow';

const mapStateToProps = state => {
    return { session: state.session }
  }

class UserIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { users: [], headers : {} }
        this.deleteUser = this.deleteUser.bind(this);
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            const headers = { headers: { Authorization: `Bearer ${this.props.session.credentials.accessToken}`}};
            this.setState({ headers});
            
            axios.get( apiConfig.host + apiConfig.port + `/api/user`, headers).then(data => {
                data.data.sort((a,b) => (a.Username > b.Username) ? 1 : ((b.Username > a.Username) ? -1 : 0));
                this.setState({ users: data.data })
            });
        }
    }

    deleteUser(id ) {
        axios.delete(apiConfig.host + apiConfig.port + `/api/user/${id}`, this.state.headers).then(data => {
            const index = this.state.users.findIndex(user => user.id === id);
            this.state.users.splice(index, 1);
            this.props.history.push('/user');
        })
    }

    render() {
        const users = this.state.users;
        return (
           <MainContainer>
                <div className="row mx-auto">
                    <div className="card um-main-body mx-auto">
                        <div className="card-block">
                            <div className="card-title">
                                <strong>Users</strong> <Link to={'user/create'} className="btn btn-sm btn-outline-secondary float-right"> Create New User</Link>
                            </div>
                            <div className="card-text">
                                {users.length === 0 ?(
                                <div className="text-center">
                                    <h2>No users found at the moment</h2>
                                </div>
                                ) :(
                                <div className="container">
                                    <div className="table-responsive-md">
                                        <table className="table table-bordered table-striped table-responsive">
                                            <thead className="thead-light">
                                                <tr>
                                                    <th scope="col">Username</th>
                                                    <th scope="col">Full Name</th>
                                                    <th scope="col">Email</th>
                                                    <th scope="col">Phone</th>
                                                    <th scope="col">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users && users.map(user =>
                                                <UserRow user={user} deleteUser={this.deleteUser} key={user.Username}></UserRow>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>)}
                            </div>
                        </div>
                    </div>
                </div>
            </MainContainer>
        )
    }
}
export default connect(mapStateToProps)(UserIndex)