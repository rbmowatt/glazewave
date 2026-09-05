import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { s3Conf } from './../../config/s3';
import moment from 'moment'
import { withRouter } from "react-router";

const HIGH_RATING = 8;

const present = (value) =>
    value !== null && value !== undefined && value !== '' && Number(value) !== 0;

// SessionData only rides along where the caller asked for it in `withs`; the
// dashboard does not, so the stats strip stays empty there rather than
// rendering a row of blanks.
const stats = (datum) => {
    if (!datum) return [];
    const out = [];
    if (present(datum.wave_height)) out.push(`WAVE ${datum.wave_height}FT`);
    if (present(datum.swell_height)) {
        out.push(present(datum.swell_period)
            ? `SWELL ${datum.swell_height}FT @ ${datum.swell_period}S`
            : `SWELL ${datum.swell_height}FT`);
    }
    if (present(datum.wind_speed)) out.push(`WIND ${datum.wind_speed}KT`);
    if (present(datum.water_temperature)) out.push(`WATER ${datum.water_temperature}°F`);
    return out;
};

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
    const isPublic = Number(session.is_public) === 1;
    const cells = props.detailed ? stats(session.SessionDatum) : [];

    return (
        <div className={`gw-row${props.detailed ? ' gw-row-lg' : ''}`}>
            <img className="gw-row-thumb" alt={session.title} src={image} onClick={open} />
            <div className="gw-row-body" onClick={open}>
                <div className="gw-row-titleline">
                    <div className="gw-row-title">{session.title}</div>
                    {props.detailed &&
                        <div className={`gw-row-tag${isPublic ? ' is-public' : ''}`}>
                            {isPublic ? 'Public' : 'Private'}
                        </div>
                    }
                </div>
                <div className="gw-row-meta">{meta}</div>
                {cells.length > 0 &&
                    <div className="gw-row-stats">
                        {cells.map(cell => <div key={cell}>{cell}</div>)}
                    </div>
                }
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
            {props.detailed ? (
                <div className="gw-row-score" onClick={open}>
                    <div className={`gw-row-rating${rating >= HIGH_RATING ? ' is-high' : ''}`}>
                        {rating ? rating.toFixed(1) : "--"}
                    </div>
                    <div className="gw-row-score-label">Rating</div>
                </div>
            ) : (
                <div className={`gw-row-rating${rating >= HIGH_RATING ? ' is-high' : ''}`} onClick={open}>
                    {rating ? rating.toFixed(1) : "--"}
                </div>
            )}
        </div>
    )
}
export default withRouter(SessionCard);
