import React from 'react';
import { borrowedMetres, asKm } from './../../lib/utils/distance';

/*
 * Units are fixed by backend/app/services/conditions: heights are converted to
 * feet, sea surface temperature to Fahrenheit, wind to knots and pressure to
 * inHg before anything is stored, so these labels are not a display choice.
 */
const FIELDS = [
    { key: 'wave_height', label: 'Wave height', unit: 'ft' },
    { key: 'wave_period', label: 'Wave period', unit: 's' },
    { key: 'swell_height', label: 'Swell height', unit: 'ft' },
    { key: 'swell_period', label: 'Swell period', unit: 's' },
    { key: 'water_temperature', label: 'Water temp', unit: '°F' },
    { key: 'wind_speed', label: 'Wind speed', unit: 'kt' },
    { key: 'pressure', label: 'Pressure', unit: 'in' },
];

/*
 * Zero is data. This used to treat it as absent, which was harmless only while
 * the columns were text and a null coerced to the string "0.0"; now that they
 * are numeric a genuinely flat day would disappear from the tiles.
 */
const present = (value) =>
    value !== null && value !== undefined && value !== '';

const Conditions = props => {
    const values = props.values || (props.session && props.session.SessionDatum) || {};
    const tiles = FIELDS.filter(field => present(values[field.key]));

    if (!tiles.length) {
        // resolved_at set with nothing to show means the point was checked and
        // has no marine model coverage, which is a different thing from a
        // session nobody ever looked conditions up for.
        const checked = present(values.resolved_at);
        return (
            <div>
                {props.title !== null && <div className="gw-eyebrow mb-3">{props.title || 'Conditions'}</div>}
                <div className="gw-trend-empty">
                    {checked ? 'NO MARINE DATA FOR THIS LOCATION' : 'NO CONDITIONS RECORDED'}
                </div>
            </div>
        );
    }

    /*
     * Only the callers that know which point was asked about pass an origin.
     * The dashboard's lifetime averages have no single origin, so they get no
     * note rather than a wrong one.
     */
    const borrowed = borrowedMetres(props.origin, values);

    return (
        <div>
            {props.title !== null && <div className="gw-eyebrow mb-3">{props.title || 'Conditions'}</div>}
            <div className="gw-tiles">
                {tiles.map(field => (
                    <div className="gw-tile" key={field.key}>
                        <div className="gw-tile-label">{field.label}</div>
                        <div className="gw-tile-value">
                            {values[field.key]}
                            <span className="gw-tile-unit"> {field.unit}</span>
                        </div>
                    </div>
                ))}
            </div>
            {borrowed && (
                <div className="gw-borrowed">
                    Nearest reading, {asKm(borrowed)} away
                </div>
            )}
        </div>
    );
};
export default Conditions;
