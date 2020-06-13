import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import StarBar from './../layout/StarBar';

class ManufacturerRow extends React.Component {
    render(){
        return (
            <div className="row table-row" key={this.props.manufacturer.id}>
                <div className="col-6">
                <div><button className="btn btn-link"  onClick={() => this.props.viewManufacturer(this.props.manufacturer.id)}>{this.props.manufacturer.name}</button></div>
                </div>
                <div className="col-3">
                {this.props.manufacturer.createdAt}
                </div>
                <div className="col-3 manufacturer-details">
                    <div>{!this.props.manufacturer.is_public || this.props.manufacturer.is_public === "0" ? 'Private' : 'Public'}</div>    
                    <div><StarBar stars={this.props.manufacturer.rating} /></div>
                    <div className="edit-delete"> 
                    { this.props.isAdmin && 
                        <FontAwesomeIcon size="lg" alt="edit user" style={{ marginLeft:'.1em' , cursor:'pointer'}}  icon={faEdit} onClick={() => this.props.editManufacturer(this.props.manufacturer.id)} />
                    }
                    { this.props.isAdmin && 
                        <FontAwesomeIcon  size="lg"  alt="delete user" style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}}  icon={faTrash} onClick={() => this.props.deleteManufacturer(this.props.manufacturer.id)} />
                    }
                    </div>
                </div>
            </div>


        )
    }
}
export default ManufacturerRow;