import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar } from '@fortawesome/free-solid-svg-icons'

const StarBar = props =>{
    let content = [];
    for (let i = 0; i < props.stars; i++) {
       content.push(<FontAwesomeIcon  className="star" icon={faStar} size='1x' key={i+1} />);
    }
    return (
        content 
    )
}
export default StarBar;