import React from 'react';
import { connect } from "react-redux";
import { safeLocate, defaultOptions } from './../../../lib/utils/geolocator';
import { ConditionsLoaded } from './../../../actions/conditions';
import { getSessionData } from './helpers/session';
import { asKm } from './../../../lib/utils/distance';
import { readViewLocation, onViewLocationChange } from './../../../lib/utils/viewLocation';

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
      region: null,
      /*
       * Owned here rather than handed down. This widget renders on the board
       * and session indexes too, and those pages have no reason to know the
       * pin exists - passing it as a prop meant they quietly reverted to the
       * browser fix while the dashboard honoured it.
       */
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
      // The store holds whatever the last position resolved to, so it cannot
      // answer for a pin. Fetching unconditionally also means re-picking the
      // same spot refreshes the hour rather than repainting a stale one.
      this.setState({ location: pin.name, region: pin.region || null });
      this.fetch(pin.lat, pin.lon);
      return;
    }

    this.setState({ location: '', region: null });
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
        // Only the located position goes into the store: the session form
        // reads it as a starting point, and a pinned coast is not where the
        // surfer is.
        if (share) this.props.conditionsLoaded(data);
        this.setState({ data: data });
      })
      .catch(() => { });
  }

  render() {
    const { data, location, region } = this.state;
    const rows = ROWS.filter(row => data[row.key] !== null && data[row.key] !== undefined);
    // Set by the backend when it had no wave data here and borrowed the
    // nearest spot, and measured the same way the list below this one measures.
    const borrowed = data.borrowed_m;
    return (
      <div>
        <div className="gw-eyebrow">Local report</div>
        <div className="gw-report-title">{location || 'Your position'}</div>
        {region && <div className="gw-report-region">{region}</div>}
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
