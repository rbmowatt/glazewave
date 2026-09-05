import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { s3Conf } from './../../config/s3';
import moment from 'moment'
import { withRouter } from "react-router";

const HIGH_RATING = 8;

const SessionCard = props => {
    const { session } = props;
    const open = () => props.history.push("/session/" + session.id);
    const image = session.SessionImages && session.SessionImages.length
        ? s3Conf.root + session.SessionImages[0].name
        : "/img/session_default_lg.png";

    const meta = [
        moment(session.createdAt).format("MMM DD"),
        session.Location && session.Location.name,
        session.UserBoard && session.UserBoard.name,
    ].filter(Boolean).join(" · ");

    const rating = Number(session.rating) || 0;

    return (
        <div className="gw-row">
            <img className="gw-row-thumb" alt={session.title} src={image} onClick={open} />
            <div className="gw-row-body" onClick={open}>
                <div className="gw-row-title">{session.title}</div>
                <div className="gw-row-meta">{meta}</div>
            </div>
            {props.isOwner &&
                <div className="gw-row-actions">
                    {props.editSession &&
                        <FontAwesomeIcon alt="edit session" icon={faEdit}
                            onClick={() => props.editSession(session.id)} />
                    }
                    {props.deleteSession &&
                        <FontAwesomeIcon alt="delete session" icon={faTrash}
                            onClick={(e) => { e.preventDefault(); props.deleteSession(session.id) }} />
                    }
                </div>
            }
            <div className={`gw-row-rating${rating >= HIGH_RATING ? ' is-high' : ''}`} onClick={open}>
                {rating ? rating.toFixed(1) : "--"}
            </div>
        </div>
    )
}
export default withRouter(SessionCard);
