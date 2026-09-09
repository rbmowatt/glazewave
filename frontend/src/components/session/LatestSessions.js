import React from 'react';
import SessionCard from './SessionCard';
import { Link } from 'react-router-dom';

export const LatestSessions = props => {
    const sessions = props.sessions || [];
    return (
        <div>
            <div className="gw-list-head">
                <div className="gw-eyebrow">Recent sessions</div>
                {sessions.length > 0 &&
                    <Link className="gw-link" to={'/session'}>ALL {sessions.length} &rarr;</Link>
                }
            </div>
            {sessions.length === 0 ? (
                <div className="gw-empty">
                    NOTHING LOGGED YET
                    <br />
                    <button type="button" className="gw-link" onClick={props.onLogSession}>
                        LOG YOUR FIRST SESSION &rarr;
                    </button>
                </div>
            ) : (
                <div className="gw-list">
                    {sessions.slice(0, props.limit).map(session => (
                        <SessionCard session={session} key={session.id} />
                    ))}
                </div>
            )}
        </div>
    )
}
