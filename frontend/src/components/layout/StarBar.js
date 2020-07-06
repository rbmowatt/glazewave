import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStar } from '@fortawesome/free-solid-svg-icons'

const StarBar = props =>{
    const content = [];
    const size = props.size ? props.size : 'xs';
    const starClassname = (props.static && props.static === true) ? 'star-static' : 'star';
    const disabledClassname = (props.static && props.static === true) ? 'star-disabled-static' : 'star-disabled';
    const onClick = (rating) =>
    {
        if(props.static && props.static === true) return;
        if(props.onClick)
        {
            props.onClick({rating})
        }
    }
    if(!props.stars || props.stars === 0) {
    for (let i = 0; i < 10; i++) {
        content.push(<FontAwesomeIcon  className={disabledClassname} icon={faStar} onClick={()=>{onClick(i + 1)}} size={size} key={i+1} />);
     }
    }
    else{ 
    for (let i = 0; i < props.stars; i++) {
       content.push(<FontAwesomeIcon  className={starClassname} icon={faStar} size={size} onClick={()=>{onClick(i + 1)}} key={i+1} />);
    }
    for (let i =  props.stars; i < 10 ; i++) {
        content.push(<FontAwesomeIcon  className={disabledClassname} icon={faStar} onClick={()=>{onClick(i + 1)}} size={size} key={i+1} />);
     }
    }
    return (
        content 
    )
}
export default StarBar;