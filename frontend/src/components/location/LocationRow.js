import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import StarBar from './../layout/StarBar';

class LocationRow extends React.Component {
    render(){
        return (
            <div className="row table-row" key={this.props.location.id}>
                <div className="col-6">
                <div><a  onClick={() => this.props.viewLocation(this.props.location.id)}>{this.props.location.name}</a></div>
                <div>{this.props.location.City.name}</div>
                </div>
                <div className="col-3">
                {this.props.location.createdAt}
                </div>
                <div className="col-3 location-details">
                    <div>{!this.props.location.is_public || this.props.location.is_public === "0" ? 'Private' : 'Public'}</div>    
                    <div><StarBar stars={this.props.location.rating} /></div>
                    <div className="edit-delete"> 
                    { this.props.isAdmin && 
                        <FontAwesomeIcon size="lg" alt="edit user" style={{ marginLeft:'.1em' , cursor:'pointer'}}  icon={faEdit} onClick={() => this.props.editLocation(this.props.location.id)} />
                    }
                    { this.props.isAdmin && 
                        <FontAwesomeIcon  size="lg"  alt="delete user" style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}}  icon={faTrash} onClick={() => this.props.deleteLocation(this.props.location.id)} />
                    }
                    </div>
                </div>
            </div>


        )
    }
}
export default LocationRow;