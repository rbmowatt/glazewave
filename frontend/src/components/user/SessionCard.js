import React from 'react';
import StarBar from './../layout/StarBar';

const SessionCard = props =>{
    return (
        <div className="row col-md-12">
            <div className="col-md-12"><h5><a href={"/session/" + props.session.id }>{props.session.title}</a></h5></div>
            <div className="col-md-3">
                <img src={props.session.image ? props.session.image : "https://image.shutterstock.com/image-vector/please-no-photo-camera-vector-260nw-473234290.jpg" }/>
            </div>
            <div className="col-md-9">
                <div>{new Date(props.session.createdAt).getMonth()}/{new Date(props.session.createdAt).getDate()}/{new Date(props.session.createdAt).getFullYear()}</div>
                <div><StarBar stars={props.session.rating} /></div>
                <div>{props.session.location_id}</div>
                <div>{props.session.createdAt}</div>
            </div>
        </div>
    )
}
export default SessionCard;