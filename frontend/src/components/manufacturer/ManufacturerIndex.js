import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom';
import axios from 'axios';
import apiConfig from '../../config/api.js';
import  MainContainer  from './../layout/MainContainer';
import ManufacturerRow from './ManufacturerRow';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css


const mapStateToProps = state => {
    return { session: state.session }
  }

class ManufacturerIndex extends Component {
    constructor(props) {
        super(props);
        this.state = { manufacturers: [], headers : {}, isAdmin : false }
        this.deleteManufacturer = this.deleteManufacturer.bind(this);
        this.editManufacturer = this.editManufacturer.bind(this);
        this.viewManufacturer = this.viewManufacturer.bind(this);
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            this.setState({ isAdmin : this.props.session.isAdmin });
            
            
            axios.get( apiConfig.host + apiConfig.port + `/api/manufacturer`, this.props.session.headers).then(data => {
                data.data.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
                this.setState({ manufacturers: data.data })
            });
        }
    }

    deleteManufacturer(id ) {
        confirmAlert({
            title: 'Confirm To Delete',
            message: 'Are you sure you want to delete this session?',
            buttons: [
              {
                label: 'Yes',
                onClick: () => {
                    axios.delete(apiConfig.host + apiConfig.port + `/api/manufacturer/${id}`, this.props.session.headers).then(data => {
                        const index = this.state.manufacturers.findIndex(manufacturer => manufacturer.id === id);
                        this.state.manufacturers.splice(index, 1);
                        this.props.history.push('/manufacturer');
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

    editManufacturer(manufacturerId) {
        this.props.history.push('/manufacturer/edit/' + manufacturerId);
    }

    viewManufacturer(manufacturerId) {
        this.props.history.push('/manufacturer/' + manufacturerId);
    }

    render() {
        const manufacturers = this.state.manufacturers;
        return (
            <MainContainer>
                <div className="row">
                    <div className="card card-lg mx-auto">
                        <div className="card-title"><h2>Manufacturers
                        { this.state.isAdmin &&  <Link to={'manufacturer/create'} className="btn btn-sm btn-outline-secondary float-right"> Create New Manufacturer</Link>}
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
                                        Manufacturer
                                    </div>
                                </div>
                                {manufacturers && manufacturers.map(manufacturer =>
                                (this.state.isAdmin || manufacturer.isPublic) &&
                                    <ManufacturerRow manufacturer={manufacturer} deleteManufacturer={this.deleteManufacturer} viewManufacturer={this.viewManufacturer} editManufacturer={this.editManufacturer} isAdmin={this.state.isAdmin} key={ manufacturer.id }/>
                                )
                                }
                                {
                                    (!manufacturers  || manufacturers.length === 0) &&  <div className="col-12"><h3>No manufacturers found at the moment</h3></div>
                                } 
                             </div>
                        </div>
                    </div>
                </div>
            </MainContainer>
          
        )
    }
}
export default connect(mapStateToProps)(ManufacturerIndex)