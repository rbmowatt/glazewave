import "./css/Location.css";
import React, {Component} from "react"
import { createField, fieldPresets } from 'react-advanced-form'
import { getSessionData} from './../reports/stormglass/helpers/session';
import { loadPlaces } from './../../lib/utils/googleMaps';

// Autocomplete bills per request, so a request per keystroke is real money on a
// field people type a whole beach name into.
const DEBOUNCE_MS = 300;

class Location extends Component {
    state = {
        search: "",
        value: "",
        location_id : "",
        is_editing : false,
        places : null,
        loadError : null,
        suggestions : [],
        open : false
    }

    componentDidMount() {
        loadPlaces()
            .then(places => this.setState({places}))
            .catch(err => this.setState({loadError: err.message}));
    }

    componentWillUnmount() {
        clearTimeout(this.debounce);
        this.unmounted = true;
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
        getSessionData(place.location.lat(), place.location.lng())
            .then(d=>{ if (d) this.props.onChange('conditions', d); })
            .catch(()=>{})
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
        const {value, suggestions, open, loadError} = this.state
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
