import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import LocationRow from './LocationRow';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css


const mapStateToProps = state => {
    return { session: state.session }
  }

class LocationIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { locations: [], headers : {}, isAdmin : false }
        this.deleteLocation = this.deleteLocation.bind(this);
        this.editLocation = this.editLocation.bind(this);
        this.viewLocation = this.viewLocation.bind(this);
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.setState({ isAdmin : this.props.session.isAdmin });
            const headers = { headers: { Authorization: `Bearer ${this.props.session.credentials.accessToken}`}};
            this.setState({headers});
            axios.get( apiConfig.host + apiConfig.port + `/api/location?with=City`, headers).then(data => {
                data.data.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
                this.setState({ locations: data.data })
            });
        }
    }

    deleteLocation(id ) {
        confirmAlert({
            title: 'Confirm To Delete',
            message: 'Are you sure you want to delete this session?',
            buttons: [
              {
                label: 'Yes',
                onClick: () => {
                    axios.delete(apiConfig.host + apiConfig.port + `/api/location/${id}`, this.state.headers).then(data => {
                        const index = this.state.locations.findIndex(location => location.id === id);
                        this.state.locations.splice(index, 1);
                        this.props.history.push('/location');
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

    editLocation(locationId) {
        this.props.history.push('/location/edit/' + locationId);
    }

    viewLocation(locationId) {
        this.props.history.push('/location/' + locationId);
    }

    render() {
        const locations = this.state.locations;
        return (
            <MainContainer>
                <div className="row">
                    <div className="card mx-auto">
                        <div className="card-title"><h2>Locations
                        { this.state.isAdmin &&  <Link to={'location/create'} className="btn btn-sm btn-outline-secondary float-right"> Create New Location</Link>}
                        </h2>
                        </div> 
                        <div className="card-text">
                            <div className="table-container" >
                                <div className="row table-header">
                                    <div className="col-6">
                                         Name
                                    </div>
                                    <div className="col-3">
                                        Date
                                    </div>
                                    <div className="col-3">
                                        Location
                                    </div>
                                </div>
                                {locations && locations.map(location =>
                                (this.state.isAdmin || location.isPublic) &&
                                    <LocationRow location={location} deleteLocation={this.deleteLocation} viewLocation={this.viewLocation} editLocation={this.editLocation} isAdmin={this.state.isAdmin} key={ location.id }/>
                                )
                                }
                                {
                                    (!locations  || locations.length === 0) &&  <div className="col-12"><h3>No locations found at the moment</h3></div>
                                } 
                             </div>
                        </div>
                    </div>
                </div>
            </MainContainer>
          
        )
    }
}
export default connect(mapStateToProps)(LocationIndex)