import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage } from '@fortawesome/free-solid-svg-icons'

export default props => 
    <div className=''>
      <label className="fileContainer">
        Upload An Image!
          <input type='file'  id='single' onChange={props.onChange} accept=".jpg,.jpeg,.gif,.png" /> 
      </label>
      <FontAwesomeIcon icon={faImage} color='#3B5998' size='3x' />
    </div>
