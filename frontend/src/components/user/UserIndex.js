import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import UserRow from './UserRow';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css



const mapStateToProps = state => {
    return { session: state.session }
  }

class UserIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { users: [], headers : {} }
        this.deleteUser = this.deleteUser.bind(this);
        this.editUser = this.editUser.bind(this);

        
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
        confirmAlert({
            title: 'Confirm To Delete',
            message: 'Are you sure to do this.',
            buttons: [
              {
                label: 'Yes',
                onClick: () => {
                    axios.delete(apiConfig.host + apiConfig.port + `/api/user/${id}`, this.state.headers).then(data => {
                        const index = this.state.users.findIndex(user => user.id === id);
                        this.state.users.splice(index, 1);
                        this.props.history.push('/user');
                    })
                }
              },
              {
                label: 'No',
                onClick: () => {}
              }
            ]
          });
    }

    editUser(uname) {
        this.props.history.push('/user/edit/' + uname);
    }

    render() {
        const users = this.state.users;
        return (
           <MainContainer>
               <div className="row">
                    <div className="card mx-auto">
                        <div className="card-title">
                           <h2> <strong>Users</strong> <Link to={'user/create'} className="btn btn-sm btn-outline-secondary float-right"> Create New User</Link></h2>
                        </div>
                        <div className="card-text">
                        <div className="table-container" >
                                <div className="row table-header">
                                    <div className="col-2">
                                         Login
                                    </div>
                                    <div className="col-3">
                                        Full Name
                                    </div>
                                    <div className="col-3">
                                        Email
                                    </div>
                                    <div className="col-3">
                                        Phone
                                    </div>
                                    <div className="col-1">
                                        &nbsp;
                                    </div>
                                </div>
                                {users && users.map(user =>
                                        <UserRow user={user} deleteUser={this.deleteUser} editUser={this.editUser} key={user.Username}></UserRow>
                                        )} 
                                        {
                                            (!users || users.length === 0) && <div className="col-12"><h3>No users found at the moment</h3></div>
                                        } 
                             </div>
                        </div>
                    </div>
                </div>
            </MainContainer>
        )
    }
}
export default connect(mapStateToProps)(UserIndex)