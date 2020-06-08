import * as React from 'react';
import { connect } from 'react-redux'
import Spinner from './../helpers/image/Spinner'
import Images from './../helpers/image/Images'
import Buttons from './../helpers/image/Buttons'

import { withRouter} from 'react-router-dom';

const mapStateToProps = state => {
    return { session: state.session }
  }

class ImageUpload extends React.Component{
    constructor(props ) {
        super(props);
        this.state = {
            upoading : false,
            images : [],
        }
    }

    onChanged = e => {
        const files = Array.from(e.target.files)
        this.setState({ uploading: false , images : files});
        this.props.onImageUploaded(e);
    }
    
    removeImage = id => {
      console.log(this.state.images)
        this.setState({
          images: this.state.images.filter(image => image.public_id !== id)
        })
      }

    render() {
        const {  uploading, images } = this.state;
        const content = () => {
            switch(true) {
              case uploading:
                return <Spinner />
              case images.length > 0:
                return <Images images={images} removeImage={this.removeImage} />
              default:
                return <Buttons onChange={(e)=>this.onChanged(e)} />
            }
        }
        return (
            <div className="col-md-12 ">
                {content()}
            </div>
        )
    }
}

export default connect(mapStateToProps)(withRouter(ImageUpload));
