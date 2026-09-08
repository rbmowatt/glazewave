import './css/LocationPicker.css';
import React from 'react';
import { Form } from 'react-advanced-form';
import Location from './../form/Location';
import { writeViewLocation, clearViewLocation } from './../../lib/utils/viewLocation';

/*
 * Sets the position the report and the spot list answer for, overriding the
 * browser fix until it is cleared.
 *
 * Location is a react-advanced-form field, so createField throws on mount
 * without a Form ancestor. This Form never submits - selecting a suggestion is
 * the whole interaction - so its action resolves and does nothing.
 */
class LocationPicker extends React.Component {
    state = { open: false };

    open = () => this.setState({ open: true });

    close = () => this.setState({ open: false });

    onLocation = (location) => {
        writeViewLocation(location);
        this.setState({ open: false });
        this.props.onChange(location);
    }

    onClear = () => {
        clearViewLocation();
        this.setState({ open: false });
        this.props.onChange(null);
    }

    render() {
        const { pin } = this.props;

        if (this.state.open) {
            return (
                <div className="gw-locpick gw-locpick-open">
                    <Form action={() => Promise.resolve()}>
                        <Location
                            id="view_location"
                            name="view_location"
                            label="Report on"
                            className="form-control"
                            onChange={() => {}}
                            onLocation={this.onLocation}
                            prefillNearby
                        />
                    </Form>
                    <button type="button" className="gw-locpick-link" onClick={this.close}>
                        Cancel
                    </button>
                </div>
            );
        }

        return (
            <div className="gw-locpick">
                {pin ? (
                    <div className="gw-locpick-set">
                        <button type="button" className="gw-locpick-link" onClick={this.open}>
                            Change location
                        </button>
                        <button type="button" className="gw-locpick-link" onClick={this.onClear}>
                            Use my position
                        </button>
                    </div>
                ) : (
                    <button type="button" className="gw-locpick-link" onClick={this.open}>
                        Pick a location
                    </button>
                )}
            </div>
        );
    }
}

export default LocationPicker;
