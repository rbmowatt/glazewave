//import './css/Report.css'
import React from 'react';
import { connect } from "react-redux";
import { locator, defaultOptions } from './../../../lib/utils/geolocator';
import getSpots from './../../../lib/utils/geo';
import WWClient from './../../../lib/utils/worldweather';

const mapStateToProps = (state) => {
    return {
      session: state.session,
    };
  };

class Report extends React.Component{
  constructor()
  {
    super();
    this.state = {
        data : {},
        selected : '',
        location : ''
    }
    this.setState = this.setState.bind(this);
  }

  componentDidMount() {
    const setState = this.setState;
    if (this.props.session.isLoggedIn) {
        locator.locate(defaultOptions , function (err, location) {
        if (err) return /* console.log removed */;
        getSpots(location.coords.latitude,location.coords.longitude).then(data=>{
          setState({location :data.hits[0].name })
          WWClient.marineWeatherApi({
            q: ` ${data.hits[0]._geoloc.lat},${data.hits[0]._geoloc.lon}`,
            tide : "yes"
        }, function(err, result) {
            if (!err) {
              setState({data : JSON.parse(result).data.weather[0]})
            } else {
            }
        });
            setState({spot : data.hits[0]})
        })
      });
    }
  }

  render()
  {    
    const { spots } =  this.state;
    return <div className="container surfline nearest_spots">
        <h6>Local Report</h6>
        <i>{this.state.location}</i>
        <div className="row spot" >
            <div className="col">   
            <div>Sunrise : {this.state.data.astronomy && this.state.data.astronomy[0].sunrise}</div>  
            <div>Sunset : {this.state.data.astronomy && this.state.data.astronomy[0].sunset}</div>  
            {
             this.state.data.tides && this.state.data.tides[0].tide_data.map(tide => (
                <div>{tide.tide_type} Tide : {tide.tideTime}</div>
              ))
                
              }
           
            </div>
        </div>
        


    </div>
    }  
    
}

export default connect(mapStateToProps)(Report);