//import './css/Report.css'
import React from 'react';
import { connect } from "react-redux";
import { locator, defaultOptions } from './../../../lib/utils/geolocator';
import getSpots from './../../../lib/utils/surfline_alg_geo';
import {StormGlassLoaded} from './../../../actions/stormglass';
import apiConfig from './../../../config/api';
import {getSessionData} from './helpers/session';

const mapStateToProps = (state) => {
    return {
      session: state.session,
      stormglass : state.stormglass
    };
  };

  const mapDispachToProps = (dispatch) => {
    return {
      stormglassLoaded: (data) => dispatch(StormGlassLoaded(data)),
    };
  };

class Report extends React.Component{
  constructor()
  {
    super();
    this.state = {
        data : {},
        location : ''
    }
    this.setState = this.setState.bind(this);
  }

  componentDidMount() {
    if (this.props.session.isLoggedIn) {
      if(this.props.stormglass.data.wave_period)
      {
        this.setState({data : this.props.stormglass.data});
      }
      else {
        const setState = this.setState;
        const sgLoaded = this.props.stormglassLoaded;
        locator.locate(defaultOptions , function (err, location) {
          if (err) return console.log("location err", err);
          getSessionData(location.coords.latitude,location.coords.longitude).then(data=>
            {
              sgLoaded(data);
              setState({data :data});
            })
          });
        }
      }
  }



  render()
  {    
    return <div className="container surfline nearest_spots">
          <h6>Local Report</h6>
          <div className="row spot"><div className="col"> <i>Observations Near {this.state.location}</i></div></div>
          <div className="row spot" >
            <div className="col">   
            <div>Water Temp: {this.state.data.water_temperature}F</div>  
            <div>Swell Height: {this.state.data.swell_height}ft</div>  
            <div>Swell Period: {this.state.data.swellPeriod }s</div>  
            <div>Wave Height: {this.state.data.wave_height }ft</div>  
            <div>Wave Period: {this.state.data.wave_period }s</div>  
            <div>Pressure: {this.state.data.pressure }in</div>  
            <div>Wind Speed: {this.state.data.wind_speed }k</div>  
          </div>
        </div>
      </div>
    }  
    
}


export default connect(mapStateToProps, mapDispachToProps )(Report);