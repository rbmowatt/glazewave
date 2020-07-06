import React from 'react';
import SessionCard from './SessionCard';
import { Link } from 'react-router-dom';

export const LatestSessions = props =>{
    if(!props.sessions.length){
        return (
            <div className="alert alert-primary text-center index-empty-resultset">
                <h5>Latest Sessions</h5>    
                <div>You haven't created any Sessions Yet.</div>
                <div>
                    <Link className="btn btn-sm btn-primary" to={'/session'} >Get Started!</Link>
                </div>
            </div>
        )
    }
    return (
        <div>
            <h5>Latest Sessions</h5>    
            {
            props.sessions && props.sessions.reduce((mappedArray, session, index) => {                           
                if (index < 4) { 
                    mappedArray.push(
                        <SessionCard session={session} key={session.id} />
                );
            }                                                  
            return mappedArray;
            }, [])
            }
        </div>
    )
}


