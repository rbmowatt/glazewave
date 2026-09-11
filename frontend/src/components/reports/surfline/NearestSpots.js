import './css/NearestSpots.css'
import React from 'react';
import { connect } from "react-redux";
import { Link } from 'react-router-dom';
import { safeLocate, defaultOptions } from './../../../lib/utils/geolocator';
import getSpots, { localityLabel } from './../../../lib/utils/spots';
import cache from './../../../lib/utils/cache';
import { asKm } from './../../../lib/utils/distance';
import { SpotThumb, SpotCredit } from './../../spot/SpotImage';
import { readViewLocation, onViewLocationChange } from './../../../lib/utils/viewLocation';

// Bumped with the payload, twice now: a list cached before the server sent
// crumbs carries no locality at all, and one cached between this deploy and
// the backfill carries the region but no city. Either sits for the full ten
// hours looking like the label simply does not work.
const CACHE_KEY = 'nrspt4';

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
      selected: '',
      // Owned here for the same reason as in the conditions report: this list
      // renders on the board and session indexes, which know nothing about
      // the pin and were falling back to the browser fix.
      pin: null
    }
    this.setState = this.setState.bind(this);
  }

  componentDidMount() {
    this.setState({ pin: readViewLocation() }, () => this.load());
    this.unsubscribe = onViewLocationChange((pin) => {
      if (this.unmounted) return;
      this.setState({ pin }, () => this.load());
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
    this.unmounted = true;
  }

  load() {
    if (!this.props.session.isLoggedIn) return;

    const { pin } = this.state;
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
            {spots.map(spot => {
              const region = localityLabel(spot);
              return (
              <div className="gw-spot" key={spot.id}>
                <SpotThumb image={spot.image} size={40} />
                <span className="gw-spot-body">
                  {/* Raw id in the path, never encodeURIComponent: an OSM id is
                      osm:node/357717358, the route is /spot/:id+ to match the
                      slash, and a %2F stops matching it. The outbound source
                      link lives on the spot page as the Map chip. */}
                  <Link to={`/spot/${spot.id}`}>{spot.name}</Link>
                  {region && <span className="gw-spot-region">{region}</span>}
                  <SpotCredit image={spot.image} />
                </span>
                {asKm(spot.distance_m) &&
                  <span className="gw-spot-distance">{asKm(spot.distance_m)}</span>
                }
              </div>
              );
            })}
          </div>
        )}
        {/* The spot table is seeded from Overpass, so ODbL requires this credit. */}
        <div className="gw-attribution">© OPENSTREETMAP CONTRIBUTORS</div>
      </div>
    )
  }
}

export default connect(mapStateToProps)(NearestSpots);
