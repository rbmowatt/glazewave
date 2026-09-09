import './css/NearestSpots.css'
import React from 'react';
import { connect } from "react-redux";
import { safeLocate, defaultOptions } from './../../../lib/utils/geolocator';
import getSpots from './../../../lib/utils/spots';
import cache from './../../../lib/utils/cache';
import { asKm } from './../../../lib/utils/distance';

const CACHE_KEY = 'nrspt2';

// setWithExpiry adds this to Date.now() in milliseconds, so the 36000 that was
// here was a 36-second cache, not the ten hours it reads as. Every dashboard
// mount past half a minute re-ran geolocation and re-hit /api/spot/nearest.
const CACHE_TTL_MS = 10 * 60 * 60 * 1000;

const mapStateToProps = (state) => {
  return {
    session: state.session,
  };
};

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
    this.load();
  }

  componentDidUpdate(prevProps) {
    const was = prevProps.pin;
    const now = this.props.pin;
    const same = (!was && !now) ||
      (was && now && was.lat === now.lat && was.lon === now.lon);
    if (!same) this.load();
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  load() {
    if (!this.props.session.isLoggedIn) return;

    const { pin } = this.props;
    if (pin) {
      // Not cached. The cache key is the located position, and a pin is
      // deliberate enough that a stale list is worse than a request.
      this.fetch(pin.lat, pin.lon);
      return;
    }

    const cachedHits = cache.getWithExpiry(CACHE_KEY);
    if (cachedHits) {
      this.setState({ spots: JSON.parse(cachedHits) });
      return;
    }

    const fetchFor = (lat, lon) => this.fetch(lat, lon, true);
    safeLocate(defaultOptions, function (err, location) {
      if (err) return;
      fetchFor(location.coords.latitude, location.coords.longitude);
    });
  }

  fetch(lat, lon, store = false) {
    getSpots(lat, lon)
      .then(spots => {
        if (this.unmounted) return;
        this.setState({ spots: spots });
        if (store) cache.setWithExpiry(CACHE_KEY, JSON.stringify(spots), CACHE_TTL_MS);
      })
      .catch(() => { })
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
