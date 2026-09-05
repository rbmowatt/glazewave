import React from 'react';
import { connect } from "react-redux";
import { safeLocate, defaultOptions } from './../../../lib/utils/geolocator';
import { StormGlassLoaded } from './../../../actions/stormglass';
import { getSessionData } from './helpers/session';

const mapStateToProps = (state) => {
  return {
    session: state.session,
    stormglass: state.stormglass
  };
};

const mapDispachToProps = (dispatch) => {
  return {
    stormglassLoaded: (data) => dispatch(StormGlassLoaded(data)),
  };
};

// Units are set in backend/app/services/stormcast, not here.
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
      location: ''
    }
    this.setState = this.setState.bind(this);
  }

  componentDidMount() {
    if (this.props.session.isLoggedIn) {
      if (this.props.stormglass.data.wave_period) {
        this.setState({ data: this.props.stormglass.data });
      }
      else {
        const setState = this.setState;
        const sgLoaded = this.props.stormglassLoaded;
        safeLocate(defaultOptions, function (err, location) {
          if (err) return;
          getSessionData(location.coords.latitude, location.coords.longitude).then(data => {
            if (!data) return;
            sgLoaded(data);
            setState({ data: data });
          })
            .catch(() => { })
        });
      }
    }
  }

  render() {
    const { data, location } = this.state;
    const rows = ROWS.filter(row => data[row.key] !== null && data[row.key] !== undefined);
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
        {/* Open-Meteo is CC BY 4.0; the backend service comment says so too. */}
        <div className="gw-attribution">WEATHER DATA BY OPEN-METEO.COM</div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispachToProps)(Report);
