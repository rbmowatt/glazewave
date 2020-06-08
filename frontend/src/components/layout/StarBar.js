import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar } from '@fortawesome/free-solid-svg-icons'

const StarBar = props =>{
    const content = [];
    const size = props.size ? props.size : 'xs';
    const onClick = (rating) =>
    {
        console.log(rating)
        if(props.onClick)
        {
            props.onClick({rating})
        }
    }
    if(!props.stars || props.stars === 0) {
    for (let i = 0; i < 10; i++) {
        content.push(<FontAwesomeIcon  className="star-disabled" icon={faStar} onClick={()=>{onClick(i + 1)}} size={size} key={i+1} />);
     }
    }
    else{ 
    for (let i = 0; i < props.stars; i++) {
       content.push(<FontAwesomeIcon  className="star" icon={faStar} size={size} onClick={()=>{onClick(i + 1)}} key={i+1} />);
    }
    for (let i =  props.stars; i < 10 ; i++) {
        content.push(<FontAwesomeIcon  className="star-disabled" icon={faStar} onClick={()=>{onClick(i + 1)}} size={size} key={i+1} />);
     }
    }
    return (
        content 
    )
}
export default StarBar;