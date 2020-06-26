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
        console.log('we have cached hots');
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
    console.log('spots', spots)
    return <div className="container surfline nearest_spots">
        <h6>Nearest Spots</h6>
        {spots.map(el => (
        <div className="row spot" key={el.url}>
            <div className="col">

            <a data-tip data-event="click" data-for={el.url} href="#" data-tip >{el.name}</a>
            <ReactTooltip id={el.url}  getContent={() => { 
                return <Iframe url={this.state.selected} 
                        width="450px"
                        height="450px"
                        id="myId"
                        className="myClassname"
                        display="initial"
                        position="relative"
                        loading="content loading"
                        allowFullScreen={true}
                        isCapture={true}
                        clickable={true}
                        /> }}/>             
            </div>
        </div>
        ))}


    </div>
    }  
    
}

export default connect(mapStateToProps)(NearestSpots);