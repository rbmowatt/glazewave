import React from 'react';
import StarBar from './../layout/StarBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { s3Conf } from './../../config/s3';
import moment from 'moment'
import { withRouter } from "react-router";


const SessionCard = props =>{
    return (
        <div className={props.className}>
            <div className="col-12 session-card-title"><button className="btn btn-link card-title" onClick={()=>props.history.push("/session/" + props.session.id) }>{props.session.title}</button></div>
            <div className="col-md-4">
                <img className="img-responsive img-thumbnail" 
                    src={props.session.SessionImages && props.session.SessionImages.length ? s3Conf.root + props.session.SessionImages[0].name 
                    : "https://surfmemo.s3.amazonaws.com/4b371c1dcc76131241ffe613e30ea51f" }/>
            </div>
            <div className="col-md-8">
                <div className="row">
                    { props.editSession && <FontAwesomeIcon size="lg" alt="edit user" style={{ marginLeft:'.1em' , cursor:'pointer'}}  icon={faEdit} onClick={() => props.editSession(props.session.id)} /> }
                    { props.deleteSession && <FontAwesomeIcon  size="lg"  alt="delete user" style={{ marginLeft:'.5em', cursor:'pointer', color : 'red'}}  icon={faTrash} onClick={() => props.deleteSession(props.session.id)} /> }
                </div>
                <div className="row card-date" >{moment(props.session.createdAt).calendar()}</div>
                <div className="row card-rating" ><StarBar stars={props.session.rating} /></div>
                <div className="row" >{props.session.UserBoard && props.session.UserBoard.name}</div>
                <div className="row" >{props.session.Location && props.session.Location.name}</div>
        </div>
        </div>
    )
}
export default withRouter(SessionCard);
