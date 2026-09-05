import './css/NearestSpots.css'
import React from 'react';
import { connect } from "react-redux";
import { safeLocate, defaultOptions } from './../../../lib/utils/geolocator';
import getSpots from './../../../lib/utils/spots';
import cache from './../../../lib/utils/cache';

const CACHE_KEY = 'nrspt2';

const mapStateToProps = (state) => {
  return {
    session: state.session,
  };
};

// distance_m comes straight from ST_Distance_Sphere in SurflineSpotService.
const asKm = (metres) =>
  metres === null || metres === undefined ? null : `${(metres / 1000).toFixed(1)} km`;

class NearestSpots extends React.Component {
  constructor() {
    super();
    this.state = {
      spots: [],
      selected: ''
    }
    this.setState = this.setState.bind(this);
  }

  componentDidMount() {
    const setState = this.setState;
    if (this.props.session.isLoggedIn) {
      const cachedHits = cache.getWithExpiry(CACHE_KEY);
      if (cachedHits) {
        this.setState({ spots: JSON.parse(cachedHits) });
      }
      else {
        safeLocate(defaultOptions, function (err, location) {
          if (err) return;
          getSpots(location.coords.latitude, location.coords.longitude).then(spots => {
            setState({ spots: spots })
            cache.setWithExpiry(CACHE_KEY, JSON.stringify(spots), 36000);
          })
            .catch(() => { })
        });
      }
    }
  }

  render() {
    const { spots } = this.state;
    return (
      <div className="nearest_spots">
        <div className="gw-eyebrow mb-3">Nearest spots</div>
        {spots.length === 0 ? (
          <div className="gw-trend-empty">NO SPOTS WITHIN RANGE</div>
        ) : (
          <div className="gw-spot-list">
            {spots.map(spot => (
              <div className="gw-spot" key={spot.id}>
                <a href={spot.url} target="_blank" rel="noopener noreferrer">{spot.name}</a>
                {asKm(spot.distance_m) &&
                  <span className="gw-spot-distance">{asKm(spot.distance_m)}</span>
                }
              </div>
            ))}
          </div>
        )}
        {/* The spot table is seeded from Overpass, so ODbL requires this credit. */}
        <div className="gw-attribution">© OPENSTREETMAP CONTRIBUTORS</div>
      </div>
    )
  }
}

export default connect(mapStateToProps)(NearestSpots);
