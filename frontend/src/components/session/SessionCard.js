import React from 'react';
import StarBar from './../layout/StarBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { s3Conf } from './../../config/s3';

const SessionCard = props =>{
    return (
        <div className={props.className}>
            <div className="col-md-12"><h5><a href={"/session/" + props.session.id }>{props.session.title}</a></h5></div>
            <div className="col-md-3">
                <img src={props.session.SessionImages && props.session.SessionImages.length ? s3Conf.root + props.session.SessionImages[0].name : "https://image.shutterstock.com/image-vector/please-no-photo-camera-vector-260nw-473234290.jpg" }/>
            </div>
            <div className="col-md-9">
            <div className="col-md-12">
                { props.editSession && <FontAwesomeIcon size="lg" alt="edit user" style={{ marginLeft:'.1em' , cursor:'pointer'}}  icon={faEdit} onClick={() => props.editSession(props.session.id)} /> }
                { props.deleteSession && <FontAwesomeIcon  size="lg"  alt="delete user" style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}}  icon={faTrash} onClick={() => props.deleteSession(props.session.id)} /> }
            </div>
                <div className="col-md-12" >{new Date(props.session.createdAt).getMonth()}/{new Date(props.session.createdAt).getDate()}/{new Date(props.session.createdAt).getFullYear()}</div>
                <div className="col-md-12" ><StarBar stars={props.session.rating} /></div>
                <div className="col-md-12" >{props.session.location_id}</div>
                <div className="col-md-12" >{props.session.createdAt}</div>
            </div>
          
        </div>
    )
}
export default SessionCard;
