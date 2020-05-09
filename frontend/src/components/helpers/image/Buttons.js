import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage } from '@fortawesome/free-solid-svg-icons'

export default props => 
  <div className='buttons fadein'>
    <div className='button'>
      <div><input type='file' id='single' onChange={props.onChange} /> </div>
        <FontAwesomeIcon icon={faImage} color='#3B5998' size='10x' />
    </div>
  </div>