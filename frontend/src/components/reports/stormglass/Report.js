//import './css/Report.css'
import React from 'react';
import { connect } from "react-redux";
import { locator, defaultOptions } from './../../../lib/utils/geolocator';
import getSpots from './../../../lib/utils/surfline_alg_geo';
import {StormGlassLoaded} from './../../../actions/stormglass';

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
      if(this.props.stormglass.data.wavePeriod)
      {
        this.setState({data : this.props.stormglass.data});
      }
      else {
        const  currentTime = new Date();
        const hours = currentTime.getHours();
        const setState = this.setState;
        const sgLoaded = this.props.stormglassLoaded;
        locator.locate(defaultOptions , function (err, location) {
          if (err) return console.log("location err", err);
          getSpots(location.coords.latitude,location.coords.longitude).then(data=>{
            setState({location :data.hits[0].name })
            const params = 'waveHeight,airTemperature';
            fetch(`http://localhost:3001/api/sc?lat=${data.hits[0]._geoloc.lat}&lon=${data.hits[0]._geoloc.lon}&name=${data.hits[0].id}`).then((response) => response.json()).then((jsonData) => {
              sgLoaded(jsonData.hours[currentTime.getHours()]);
              console.log(jsonData.hours[currentTime.getHours()]);
              setState({data : jsonData.hours[currentTime.getHours()]});
            });
          })
      });
    }
    }
  }

  render()
  {    
    const { spots } =  this.state;
    console.log('spots', spots)
    return <div className="container surfline nearest_spots">
          <h6>Local Report</h6>
          <div className="row spot"><div className="col"> <i>Observations Near {this.state.location}</i></div></div>
          <div className="row spot" >
            <div className="col">   
            <div>Water Temp: {this.state.data.waterTemperature && (( this.state.data.waterTemperature.sg * 9/5) + 32).toFixed()} &#176;F</div>  
            <div>Swell Height: {this.state.data.swellHeight && (this.state.data.swellHeight.sg * 3.28084).toFixed(2)} ft</div>  
            <div>Swell Period: {this.state.data.swellPeriod && this.state.data.swellPeriod.sg } s</div>  
            <div>Wave Height: {this.state.data.waveHeight && (this.state.data.waveHeight.sg * 3.28084).toFixed(2)} ft</div>  
            <div>Wave Period: {this.state.data.wavePeriod && this.state.data.wavePeriod.sg } s</div>  
            <div>Pressure: {this.state.data.pressure && this.state.data.pressure.sg } hPa</div>  
            <div>Wind Speed: {this.state.data.currentSpeed && (this.state.data.currentSpeed.sg * 1.94384 ).toFixed(2) * 100 } k</div>  
          </div>
        </div>
      </div>
    }  
    
}


export default connect(mapStateToProps, mapDispachToProps )(Report);