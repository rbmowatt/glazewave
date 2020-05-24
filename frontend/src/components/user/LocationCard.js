import React from 'react';
import StarBar from './../layout/StarBar';

const LocationCard = props =>{
    return (
        <div className="row col-md-12">
             <div className="col-md-12"><h5>{props.location.name}</h5></div>
            <div className="col-md-3">
                <img src="https://image.shutterstock.com/image-vector/please-no-photo-camera-vector-260nw-473234290.jpg" />
            </div>
            <div className="col-md-9">
                <div><StarBar stars={props.location.rating} /></div>
                <div>{props.location.notes && props.location.notes.substring(0, 50)}...</div>
                <div>{new Date(props.location.createdAt).getMonth()}/{new Date(props.location.createdAt).getDate()}/{new Date(props.location.createdAt).getFullYear()}</div>
            </div>
        </div>
    )
}
export default LocationCard;