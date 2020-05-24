import React, { Component } from 'react'
import { connect } from 'react-redux'
import './Manufacturer.css'
import axios from 'axios';
import apiConfig from '../../config/api.js';
import { MainContainer } from './../layout/MainContainer';
import {FormCard} from './../layout/FormCard';
import StarBar from './../layout/StarBar';

const mapStateToProps = state => {
    return { session: state.session }
  }

class ManufacturerView extends Component {
    constructor(props) {
        super(props);
        this.state = { session: [], headers : {} }
    }

    componentDidMount(){
        if (this.props.session.isLoggedIn) {
            
            
            axios.get( apiConfig.host + apiConfig.port + `/api/manufacturer/` + this.props.match.params.id, this.props.session.headers).then(data => {
                ((!this.props.session.isAdmin && !data.data[0].isPublic) || data.data.length === 0) ? this.props.history.push('/manufacturer') : this.setState({ session: data.data });
            })
            .catch(error=>this.props.history.push('/manufacturer'));
        }
        if(this.state.session === [])
        {
            this.props.history.push('/manufacturer');
        }
    }

    returnToIndex = e =>
    {
      this.props.history.push('/manufacturer');
    }

    render() {
        const session = this.state.session;
        const pic = (session.picture  == null) ? 'no_photo.jpg' : session.picture;
        return (
            <MainContainer>
                <FormCard returnToIndex={this.returnToIndex}>
                    <div className="container">
				        <div className="wrapper row">
                            <div className="preview col-md-6">
                                <div className="preview-pic tab-content">
                                    <div className="tab-pane active" id="pic-1"><img src={"https://umanage-mowatr.s3.amazonaws.com/" + pic } alt="session" /></div>
                                </div>
                            </div>
                            <div className="details col-md-6">
                                <h3 className="session-title">{session.title}</h3>
                                <h5 className="submitted-by">By <span>{session.createdAt}</span></h5>
                                <h5 className="review-no">Rated: {session.rating}/10 </h5>
                                <div className="rating">
                                    <StarBar stars={session.rating} />
                                </div>
                                <h5 className="review-no">Manufacturer:</h5>
                                <p className="session-description">{ session.title }</p>
                            </div>
                        </div>
                    </div>
                </FormCard>
            </MainContainer>
        )
    }
}
export default connect(mapStateToProps)(ManufacturerView)