import React from 'react';
import SessionCard from './SessionCard';
import { Link } from 'react-router-dom';

export const LatestSessions = props =>{
    if(!props.sessions.length){
        return (
            <div className="alert alert-primary text-center card-newest-resultset card-newest-empty-resultset">
                <h5>Latest Sessions</h5>    
                <div>You haven't created any Sessions Yet.</div>
                <div>
                    <Link className="btn btn-sm btn-primary" to={'/session'} >Get Started!</Link>
                </div>
            </div>
        )
    }
    return (
        <div className="alert alert-primary card-newest-resultset">
            <h5>Latest Sessions</h5>    
            {
            props.sessions && props.sessions.reduce((mappedArray, session, index) => {                           
                if (index < props.limit) { 
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


