import React from 'react';
import { connect } from "react-redux";
import { safeLocate, defaultOptions } from './../../../lib/utils/geolocator';
import { ConditionsLoaded } from './../../../actions/conditions';
import { getSessionData } from './helpers/session';
import { borrowedMetres, asKm } from './../../../lib/utils/distance';

const mapStateToProps = (state) => {
  return {
    session: state.session,
    conditions: state.conditions
  };
};

const mapDispachToProps = (dispatch) => {
  return {
    conditionsLoaded: (data) => dispatch(ConditionsLoaded(data)),
  };
};

// Units are set in backend/app/services/conditions, not here.
const ROWS = [
  { key: 'swell_height', label: 'Swell', unit: 'ft' },
  { key: 'swell_period', label: 'Swell period', unit: 's' },
  { key: 'wave_height', label: 'Wave', unit: 'ft' },
  { key: 'wave_period', label: 'Wave period', unit: 's' },
  { key: 'wind_speed', label: 'Wind', unit: 'kt' },
  { key: 'water_temperature', label: 'Water', unit: '°F' },
  { key: 'pressure', label: 'Pressure', unit: 'in' },
];

class Report extends React.Component {
  constructor() {
    super();
    this.state = {
      data: {},
      location: '',
      // The point asked about. The payload's lat/lon is the point that
      // answered, and the two differ when the backend borrowed a spot.
      origin: null
    }
    this.setState = this.setState.bind(this);
  }

  componentDidMount() {
    this.load();
  }

  /*
   * A pin change is the only prop change worth reacting to. Comparing the
   * objects would refetch on every dashboard render, since the parent builds a
   * fresh one each time it reads localStorage.
   */
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
      // The store holds whatever the last position resolved to, so it cannot
      // answer for a pin. Fetching unconditionally also means re-picking the
      // same spot refreshes the hour rather than repainting a stale one.
      this.setState({ location: pin.name });
      this.fetch(pin.lat, pin.lon);
      return;
    }

    this.setState({ location: '' });
    if (this.props.conditions.data.wave_period) {
      this.setState({ data: this.props.conditions.data });
      return;
    }

    const fetchFor = (lat, lon) => this.fetch(lat, lon, true);
    safeLocate(defaultOptions, function (err, location) {
      if (err) return;
      fetchFor(location.coords.latitude, location.coords.longitude);
    });
  }

  fetch(lat, lon, share = false) {
    getSessionData(lat, lon)
      .then(data => {
        if (!data || this.unmounted) return;
        // Set with the data, not before the request. A failed lookup would
        // otherwise leave the previous position's values next to the new
        // origin, and the note would measure a distance between two points
        // that never went together.
        this.setState({ origin: { lat, lon } });
        // Only the located position goes into the store: the session form
        // reads it as a starting point, and a pinned coast is not where the
        // surfer is.
        if (share) this.props.conditionsLoaded(data);
        this.setState({ data: data });
      })
      .catch(() => { });
  }

  render() {
    const { data, location, origin } = this.state;
    const rows = ROWS.filter(row => data[row.key] !== null && data[row.key] !== undefined);
    const borrowed = borrowedMetres(origin, data);
    return (
      <div>
        <div className="gw-eyebrow">Local report</div>
        <div className="gw-report-title">{location || 'Your position'}</div>
        {rows.length === 0 ? (
          <div className="gw-trend-empty">NO OBSERVATIONS FOR THIS POSITION</div>
        ) : (
          <div className="gw-kv">
            {rows.map(row => (
              <div className="gw-kv-row" key={row.key}>
                <span>{row.label}</span>
                <span>{data[row.key]}{row.unit}</span>
              </div>
            ))}
          </div>
        )}
        {borrowed && (
          <div className="gw-borrowed">Nearest reading, {asKm(borrowed)} away</div>
        )}
        {/* Open-Meteo is CC BY 4.0; the backend service comment says so too. */}
        <div className="gw-attribution">WEATHER DATA BY OPEN-METEO.COM</div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispachToProps)(Report);
