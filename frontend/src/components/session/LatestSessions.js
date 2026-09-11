import React from 'react';
import SessionCard from './SessionCard';
import { Link } from 'react-router-dom';

export const LatestSessions = props => {
    const sessions = props.sessions || [];
    // The list request caps at 20 rows, so its length is a page size and not a
    // total. The count comes off the server aggregation, and an absent count
    // renders as no number at all - falling back to the page size here is the
    // bug this replaced.
    const total = props.total;
    return (
        <div>
            <div className="gw-list-head">
                <div className="gw-eyebrow">Recent sessions</div>
                {sessions.length > 0 &&
                    <Link className="gw-link" to={'/session'}>{typeof total === 'number' ? `ALL ${total} ` : 'ALL '}&rarr;</Link>
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
