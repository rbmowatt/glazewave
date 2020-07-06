import './css/NearestSpots.css'
import React from 'react';
import { connect } from "react-redux";
import { locator, defaultOptions } from './../../../lib/utils/geolocator';
import getSpots from './../../../lib/utils/surfline_alg_geo';
import ReactTooltip from 'react-tooltip'
import Iframe from 'react-iframe'
import  cache from './../../../lib/utils/cache';

const CACHE_KEY = 'nrspt';

const mapStateToProps = (state) => {
    return {
      session: state.session,
    };
  };

class NearestSpots extends React.Component{
  constructor()
  {
    super();
    this.state = {
        spots : [],
        selected : ''
    }
    this.setState = this.setState.bind(this);
  }

  componentDidMount() {
    const setState = this.setState;
    if (this.props.session.isLoggedIn) 
    {
      const cachedHits = cache.getWithExpiry(CACHE_KEY);
      if (cachedHits) {
        this.setState({ spots: JSON.parse(cachedHits) });
      }
      else
      {
        locator.locate(defaultOptions , function (err, location) {
        if (err) return console.log("location err", err);
        getSpots(location.coords.latitude,location.coords.longitude).then(data=>{
            setState({spots : data.hits})
            cache.setWithExpiry(CACHE_KEY, JSON.stringify(data.hits), 36000);
          })
        });
      }
    }
  }


  render()
  {    
    const { spots } =  this.state;
    return <div className="container surfline nearest_spots">
        <h6>Nearest Spots</h6>
        {spots.map(el => (
        <div className="row spot" key={el.url}>
            <div className="col">
              <a href={el.url} target="_blank">{el.name}</a>        
            </div>
        </div>
        ))}
    </div>
    }  
    
}

export default connect(mapStateToProps)(NearestSpots);

/**
 * 
  render()
  {    
    const { spots } =  this.state;
    return <div className="container surfline nearest_spots">
        <h6>Nearest Spots</h6>
        {spots.map(el => (
        <div className="row spot" key={el.url}>
            <div className="col">
            <div data-tip data-event="click" data-for={el.url} href="#" data-tip="http://localhost:3000/user/dashboard" data-iscapture='true'>{el.name}</div>
            <ReactTooltip id={el.url}  getContent={(datatip) => { 
                return <Iframe url={datatip} 
                        width="450px"
                        height="450px"
                        /> }}
                        isCapture={true}
                      />             
            </div>
        </div>
        ))}
    </div>
    }  
 */