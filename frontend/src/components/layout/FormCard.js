import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons'

export const FormCard = props =>{
    return (
        <div className="row">
            <div className="card card-lg mx-auto">
                <div  href="#" ><FontAwesomeIcon  className="float-right card-close" icon={faTimesCircle} size='2x' onClick={props.returnToIndex} /></div>
                <div className="card-text">
                    { props.children }
                </div>
            </div>
        </div>
    )
}