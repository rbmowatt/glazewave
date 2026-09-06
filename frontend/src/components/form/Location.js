import "./css/Location.css";
import React, {Component} from "react"
import { createField, fieldPresets } from 'react-advanced-form'
import { getSessionData} from './../reports/conditions/helpers/session';
import { loadPlaces } from './../../lib/utils/googleMaps';
import getSpots from './../../lib/utils/spots';

// Autocomplete bills per request, so a request per keystroke is real money on a
// field people type a whole beach name into.
const DEBOUNCE_MS = 300;

// Tighter than the 50km /api/spot/nearest default. These are chips you tap
// without reading, so a spot an hour up the coast is a wrong answer, not a
// choice.
const NEARBY_RADIUS_M = 25000;
const NEARBY_LIMIT = 4;

// distance_m comes straight from ST_Distance_Sphere in SurflineSpotService.
const asKm = (metres) =>
    metres === null || metres === undefined ? null : `${(metres / 1000).toFixed(1)} km`;

class Location extends Component {
    state = {
        search: "",
        value: "",
        location_id : "",
        is_editing : false,
        places : null,
        loadError : null,
        suggestions : [],
        open : false,
        nearby : [],
        lat : null,
        lng : null
    }

    componentDidMount() {
        loadPlaces()
            .then(places => this.setState({places}))
            .catch(err => this.setState({loadError: err.message}));
        if (this.props.prefillNearby) this.locateNearbySpots();
    }

    /*
     * navigator.geolocation, not the geolocator package the report widgets use.
     * Google is not involved in this half at all - the browser supplies the
     * coords and /api/spot/nearest answers from MySQL - so these chips work with
     * REACT_APP_GOOGLE_API_KEY unset, which is the state the app ships in.
     *
     * Every failure is silent on purpose. A denied permission, a timeout and an
     * empty radius are all the same outcome here: no chips, and the autocomplete
     * below is still the way in.
     */
    locateNearbySpots = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (this.unmounted) return;
                getSpots(
                    position.coords.latitude,
                    position.coords.longitude,
                    NEARBY_RADIUS_M,
                    NEARBY_LIMIT
                )
                    .then(spots => {
                        if (!this.unmounted) this.setState({nearby: spots});
                    })
                    .catch(() => {});
            },
            () => {},
            {enableHighAccuracy: true, timeout: 10000, maximumAge: 300000}
        );
    }

    // The conditions belong to an hour, not just a place, so moving the
    // session's date has to re-ask for them.
    componentDidUpdate(prevProps) {
        if (prevProps.at !== this.props.at) this.fetchConditions();
    }

    componentWillUnmount() {
        clearTimeout(this.debounce);
        this.unmounted = true;
    }

    /*
     * Only the create form previews conditions. On an existing session the
     * server resolves them during the save and returns them with the record,
     * so fetching here would spend a request on a value the store is about to
     * replace anyway.
     */
    fetchConditions = () => {
        const {lat, lng} = this.state;
        if (!this.props.previewConditions) return;
        if (lat === null || lat === undefined) return;

        this.props.onChange('conditionsError', null);
        getSessionData(lat, lng, this.props.at)
            .then(data => {
                if (this.unmounted) return;
                this.props.onChange('conditions', data);
            })
            .catch(err => {
                if (this.unmounted) return;
                // This was swallowed, which is how a session saved with no
                // conditions and nothing on screen to say why.
                this.props.onChange('conditions', {});
                this.props.onChange('conditionsError', err.message);
            });
    }

    handleInputChange = e => {
        const search = e.target.value;
        this.setState({search, value: search, is_editing: true});
        clearTimeout(this.debounce);
        if (!search.trim()) {
            this.setState({suggestions: [], open: false});
            return;
        }
        this.debounce = setTimeout(() => this.fetchSuggestions(search), DEBOUNCE_MS);
    }

    fetchSuggestions = async (input) => {
        const { places } = this.state;
        if (!places) return;
        const { AutocompleteSuggestion, AutocompleteSessionToken } = places;
        // One token spans a whole typing session and is consumed by
        // fetchFields, which is what makes the autocomplete calls free and
        // bills only the details call that follows.
        if (!this.token) this.token = new AutocompleteSessionToken();
        try {
            const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input,
                sessionToken: this.token
            });
            if (this.unmounted) return;
            this.setState({
                suggestions: suggestions.filter(s => s.placePrediction),
                open: true
            });
        } catch (err) {
            if (!this.unmounted) this.setState({suggestions: [], open: false});
        }
    }

    handleSelectSuggest = async (suggestion) => {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({fields: ['id', 'displayName', 'formattedAddress', 'location']});
        // fetchFields closes the session, so the next keystroke has to open a
        // new one or every later request bills as an unsessioned call.
        this.token = null;
        if (this.unmounted) return;

        this.setState({
            search: "",
            value: place.formattedAddress || place.displayName,
            location_id: place.id,
            is_editing: false,
            suggestions: [],
            open: false
        });
        this.props.onChange('location_id', place.id);
        // The display name, not the formatted address: the create form builds a
        // session title from it and "Ocean Grove Beach" is a title where
        // "Ocean Grove Beach, Ocean Grove, NJ 07756, USA" is not.
        this.props.onChange('location_name', place.displayName || place.formattedAddress);
        this.setState(
            {lat: place.location.lat(), lng: place.location.lng()},
            this.fetchConditions
        );
    }

    /*
     * A spot id is a surfline_spots primary key, not a Google place id, and it
     * lands in sessions.location_id the same way one does. LocationService
     * reads that table before it calls Google, so nothing on this path needs a
     * key or a billed details request.
     */
    handleSelectSpot = (spot) => {
        // Anything typed before the chip was tapped opened an autocomplete
        // session that fetchFields will never consume. Dropping the token here
        // stops the next keystroke extending a session across two lookups,
        // which Google bills as unsessioned.
        this.token = null;
        // lat/lon are VARCHAR on surfline_spots and the nearest query CASTs
        // them, so mysql2 hands them back as strings.
        const lat = Number(spot.lat);
        const lng = Number(spot.lon);
        this.setState({
            search: "",
            value: spot.name,
            location_id: spot.id,
            is_editing: false,
            suggestions: [],
            open: false,
            nearby: []
        });
        this.props.onChange('location_id', spot.id);
        this.props.onChange('location_name', spot.name);
        this.setState({lat, lng}, this.fetchConditions);
    }

    onBlur = (e)=>
    {
      // Deferred so a click on a suggestion registers before the list closes.
      setTimeout(() => {
        if (this.unmounted) return;
        this.setState({open: false});
        if(this.state.is_editing){
          this.setState({
            value: '',
            is_editing : false
          })
        }
      }, 150);
    }

    render() {
        const {value, search, suggestions, open, loadError, nearby, location_id} = this.state
        const { fieldProps, fieldState, id, name, label, hint } = this.props

        const {
          touched,
          pristine,
          required,
          validating,
          validatedSync,
          validatedAsync,
          valid,
          validSync,
          validAsync,
          invalid,
          errors,
        } = fieldState

        const inputClassNames = [
          'form-control',
          touched && 'is-touched',
          pristine && 'is-pristine',
          validating && 'is-validating',
          validatedSync && 'validated-sync',
          validatedAsync && 'validated-async',
          valid && 'is-valid',
          validSync && 'valid-sync',
          validAsync && 'valid-async',
          invalid && 'is-invalid',
          'google-locations-input'
        ]
          .filter(Boolean)
          .join(' ')

        const inputProps = {
          ...fieldProps,
          className: inputClassNames,
          autoComplete: "off"
        };

        const wrapperClass = !this.props.display ? "location-field" : "location-field d-none";

        return (
          <div className={wrapperClass}>
            {label && (
              <label htmlFor={id || name}>
                {label}
                {required && ' *'}
              </label>
            )}
            <div className="location-field-input">
              <input
                {...inputProps}
                type="text"
                autoComplete="off"
                value={value}
                onBlur={this.onBlur}
                onChange={this.handleInputChange}
              />
              {open && suggestions.length > 0 && (
                <ul className="list-group location-suggestions">
                  {suggestions.map(suggestion => (
                    <li
                      key={suggestion.placePrediction.placeId}
                      className="list-group-item list-group-item-action"
                      onMouseDown={() => this.handleSelectSuggest(suggestion)}
                    >
                      {suggestion.placePrediction.text.toString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {nearby.length > 0 && !location_id && !search && (
              <div className="location-nearby">
                <div className="location-nearby-label">Spots near you</div>
                <div className="location-nearby-chips">
                  {nearby.map(spot => (
                    <button
                      key={spot.id}
                      /* Bare buttons submit the react-advanced-form Form. */
                      type="button"
                      className="location-nearby-chip"
                      onClick={() => this.handleSelectSpot(spot)}
                    >
                      {spot.name}
                      {asKm(spot.distance_m) && (
                        <span className="location-nearby-distance">
                          {asKm(spot.distance_m)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {/* These names come from the Overpass-seeded spot table, so
                    ODbL requires the credit wherever they are shown. */}
                <div className="location-nearby-credit">
                  © OpenStreetMap contributors
                </div>
              </div>
            )}

            {loadError && (
              <small className="form-text text-muted">
                Location lookup is unavailable.
              </small>
            )}

            {hint && <small className="form-text text-muted">{hint}</small>}

            {errors &&
              errors.map((error, index) => (
                <div key={index} className="invalid-feedback">
                  {error}
                </div>
              ))}
          </div>
        )
    }
}

export default createField(fieldPresets.input)(Location)
