import './css/LocationPicker.css';
import React from 'react';
import { Form } from 'react-advanced-form';
import Location from './../form/Location';
import { writeViewLocation, clearViewLocation } from './../../lib/utils/viewLocation';
import { checkCoastal } from './../../lib/utils/spots';

/*
 * Sets the position the report and the spot list answer for, overriding the
 * browser fix until it is cleared.
 *
 * Location is a react-advanced-form field, so createField throws on mount
 * without a Form ancestor. This Form never submits - selecting a suggestion is
 * the whole interaction - so its action resolves and does nothing.
 */
class LocationPicker extends React.Component {
    state = { open: false, checking: false, refused: null };

    open = () => this.setState({ open: true, refused: null });

    close = () => this.setState({ open: false, refused: null });

    componentWillUnmount() {
        this.unmounted = true;
    }

    /*
     * The pin is set either way - reporting on an inland town is a reasonable
     * thing to want. What the check decides is whether the place can also be
     * logged as a session, because promotion is on first use and a place that
     * cannot be shown to touch the ocean must not enter the spot table.
     *
     * Said here rather than swallowed: a chip that silently never appears reads
     * as a broken feature rather than as an answer.
     */
    onLocation = (location) => {
        this.setState({ checking: true, refused: null });
        checkCoastal(location.lat, location.lon)
            .catch(() => ({ coastal: false }))
            .then((verdict) => {
                if (this.unmounted) return;
                const pin = Object.assign({}, location, { coastal: verdict.coastal === true });
                writeViewLocation(pin);
                this.setState({
                    open: false,
                    checking: false,
                    refused: verdict.coastal ? null : location.name
                });
                this.props.onChange(pin);
            });
    }

    onClear = () => {
        clearViewLocation();
        this.setState({ open: false, refused: null });
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
                        {this.state.checking ? 'Checking' : 'Cancel'}
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
                {this.state.refused && (
                    <div className="gw-locpick-note">
                        No ocean shoreline within 1km of {this.state.refused}, so it
                        cannot be logged as a session. The report still answers for it.
                    </div>
                )}
            </div>
        );
    }
}

export default LocationPicker;
