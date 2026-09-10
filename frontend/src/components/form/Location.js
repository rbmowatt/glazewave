import "./css/Location.css";
import React, {Component} from "react"
import { createField, fieldPresets } from 'react-advanced-form'
import { getSessionData} from './../reports/conditions/helpers/session';
import { loadPlaces } from './../../lib/utils/googleMaps';
import getSpots, { searchSpots } from './../../lib/utils/spots';
import { asKm } from './../../lib/utils/distance';
import { SpotThumb, SpotCredit, PhotoCreditLine } from './../spot/SpotImage';
import { readViewLocation, onViewLocationChange } from './../../lib/utils/viewLocation';

// The spot search is a local query and free, so this is latency tuning rather
// than cost control. Google only runs when the spot table came back empty, and
// its requests share one session token, so a shorter wait does not multiply
// what it bills.
const DEBOUNCE_MS = 180;

// Below this the search matches most of the table and ranks it by distance,
// which reads as a broken field. Matches MIN_QUERY_LENGTH on the route.
const MIN_QUERY_LENGTH = 2;

// Wider than the 50km /api/spot/nearest default, not tighter. The seed is
// sparse outside dense coast: from La Paz the two nearest spots sit at 44km and
// 47km, so the old 25km ceiling returned an empty array and the chip row never
// rendered at all. Each chip prints its own distance, so a far one reads as far
// rather than as a wrong answer.
const NEARBY_RADIUS_M = 100000;
const NEARBY_LIMIT = 4;

class Location extends Component {
    // Responses can land out of order. Only the newest request may write to
    // state, or a slow "pl" overwrites the results for "playa".
    seq = 0

    state = {
        search: "",
        value: "",
        location_id : "",
        is_editing : false,
        places : null,
        loadError : null,
        // One list, tagged by origin: spot rows come from surfline_spots and
        // place rows from Google. They are never mixed - Google is only asked
        // when the spot search found nothing - but they select differently.
        results : [],
        open : false,
        nearby : [],
        // The dashboard pin, offered as its own chip. Kept separate from
        // nearby so it stays first and survives the spot list coming back empty.
        pin : null,
        coords : null,
        lat : null,
        lng : null
    }

    componentDidMount() {
        loadPlaces()
            .then(places => this.setState({places}))
            .catch(err => this.setState({loadError: err.message}));
        if (this.props.prefillNearby) {
            this.locateNearbySpots();
            this.unsubscribe = onViewLocationChange((pin) => {
                // A spot already chosen is the surfer's answer, not a stale
                // suggestion, so a pin moving behind an in-progress form must
                // not replace it.
                if (this.state.location_id) return;
                if (pin) {
                    this.setState({pin});
                    return this.loadNearbySpots(pin.lat, pin.lon);
                }
                this.setState({nearby: [], coords: null, pin: null});
                this.locateNearbySpots();
            });
        }
    }

    /*
     * The dashboard pin wins over the browser fix. Someone reporting on another
     * coast is almost always about to log a session there, and offering the
     * spots around the machine instead is the wrong list twice over: wrong
     * chips, and a search ranked from the wrong origin.
     *
     * A pin that is itself a seeded spot comes back as its own first chip, at
     * roughly zero distance, because /api/spot/nearest measures from the point
     * it is given and that point is the spot.
     */
    locateNearbySpots = () => {
        const pin = readViewLocation();
        if (pin) {
            this.setState({pin});
            return this.loadNearbySpots(pin.lat, pin.lon);
        }

        /*
         * navigator.geolocation, not the geolocator package the report widgets
         * use. Google is not involved in this half at all - the browser
         * supplies the coords and /api/spot/nearest answers from MySQL - so
         * these chips work with REACT_APP_GOOGLE_API_KEY unset, which is the
         * state the app ships in.
         *
         * Every failure is silent on purpose. A denied permission, a timeout
         * and an empty radius are all the same outcome here: no chips, and the
         * autocomplete below is still the way in.
         */
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.loadNearbySpots(
                    position.coords.latitude,
                    position.coords.longitude
                );
            },
            () => {},
            {enableHighAccuracy: true, timeout: 10000, maximumAge: 300000}
        );
    }

    loadNearbySpots = (lat, lon) => {
        if (this.unmounted) return;
        // Held for the search ranking too, so a denied permission costs the
        // ordering and nothing else.
        this.setState({coords: {lat, lon}});
        getSpots(lat, lon, NEARBY_RADIUS_M, NEARBY_LIMIT)
            .then(spots => {
                if (!this.unmounted) this.setState({nearby: spots});
            })
            .catch(() => {});
    }

    // The conditions belong to an hour, not just a place, so moving the
    // session's date has to re-ask for them.
    componentDidUpdate(prevProps) {
        if (prevProps.at !== this.props.at) this.fetchConditions();
    }

    componentWillUnmount() {
        clearTimeout(this.debounce);
        if (this.unsubscribe) this.unsubscribe();
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
        if (search.trim().length < MIN_QUERY_LENGTH) {
            // Bump the sequence so an in-flight response for a longer string
            // cannot repopulate the list after it was cleared.
            this.seq++;
            this.setState({results: [], open: false});
            return;
        }
        this.debounce = setTimeout(() => this.fetchSuggestions(search), DEBOUNCE_MS);
    }

    /*
     * Seeded spots first, Google only when they came back empty.
     *
     * The spot table is the better answer where it has coverage: it is filtered
     * to ocean-facing coast by the seed script's shoreline test, so it cannot
     * offer a lake beach, and it ranks by distance from the person typing.
     * Google is the long tail - anywhere the seed has not been run.
     */
    fetchSuggestions = async (input) => {
        const seq = ++this.seq;

        let spots = [];
        try {
            spots = await searchSpots(input, this.state.coords || {});
        } catch (err) {
            spots = [];
        }
        if (this.unmounted || seq !== this.seq) return;

        if (spots.length) {
            this.setState({
                results: spots.map(spot => ({
                    kind: 'spot',
                    key: spot.id,
                    label: spot.name,
                    distance_m: spot.distance_m,
                    spot: spot
                })),
                open: true
            });
            return;
        }

        const places = await this.fetchPlaceSuggestions(input);
        if (this.unmounted || seq !== this.seq) return;
        this.setState({results: places, open: places.length > 0});
    }

    /*
     * Only reached on a spot miss, so the session token is minted on the first
     * request Google actually sees rather than on the first keystroke. A run of
     * typing that never leaves the spot table now opens no session at all.
     */
    fetchPlaceSuggestions = async (input) => {
        const { places } = this.state;
        if (!places) return [];
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
            return suggestions
                .filter(s => s.placePrediction)
                .map(s => ({
                    kind: 'place',
                    key: s.placePrediction.placeId,
                    label: s.placePrediction.text.toString(),
                    suggestion: s
                }));
        } catch (err) {
            return [];
        }
    }

    /*
     * The coordinates, for callers that want the point rather than the id the
     * session form saves. Both select paths end here, so a spot chip and a
     * Google suggestion emit the same shape.
     */
    emitLocation = (id, lat, lon, name) => {
        if (this.props.onLocation) this.props.onLocation({id, lat, lon, name});
    }

    handleSelectResult = (result) => {
        if (result.kind === 'spot') return this.handleSelectSpot(result.spot);
        return this.handleSelectSuggest(result.suggestion);
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
            results: [],
            open: false
        });
        this.props.onChange('location_id', place.id);
        // The display name, not the formatted address: the create form builds a
        // session title from it and "Ocean Grove Beach" is a title where
        // "Ocean Grove Beach, Ocean Grove, NJ 07756, USA" is not.
        this.props.onChange('location_name', place.displayName || place.formattedAddress);
        this.emitLocation(
            place.id,
            place.location.lat(),
            place.location.lng(),
            place.displayName || place.formattedAddress
        );
        this.setState(
            {lat: place.location.lat(), lng: place.location.lng()},
            this.fetchConditions
        );
    }

    /*
     * Takes a seeded spot and the pinned-location chip alike, so the id here is
     * a surfline_spots primary key OR a Google place id. Both land in
     * sessions.location_id the same way: LocationService reads the spot table
     * before it calls Google, so a seeded id needs no key and no billed details
     * request, and a place id falls through to the lookup that does.
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
            results: [],
            open: false,
            nearby: []
        });
        this.props.onChange('location_id', spot.id);
        this.props.onChange('location_name', spot.name);
        this.emitLocation(spot.id, lat, lng, spot.name);
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
        const {value, search, open, loadError, nearby, pin, location_id, results} = this.state

        /*
         * The pinned place leads, whether or not it is a seeded spot. That is
         * how an address typed into the dashboard picker becomes a session
         * location and starts accumulating readings, rather than being
         * unreachable because the Overpass seed never heard of it.
         *
         * Deduped by id: a pin that IS a seeded spot would otherwise appear
         * twice, once as itself and once as the nearest thing to itself.
         */
        const chips = pin && pin.id && pin.coastal
            ? [{id: pin.id, name: pin.name, lat: pin.lat, lon: pin.lon, distance_m: null}]
                .concat(nearby.filter(spot => String(spot.id) !== String(pin.id)))
            : nearby
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
              {open && results.length > 0 && (
                <ul className="list-group location-suggestions">
                  {results.map(result => (
                    <li
                      key={result.key}
                      className="list-group-item list-group-item-action location-suggestion"
                      /* Not onClick: the input's onBlur fires first and its
                         deferred handler closes the list. */
                      onMouseDown={() => this.handleSelectResult(result)}
                    >
                      {result.kind === 'spot' && (
                        <SpotThumb image={result.spot && result.spot.image} size={40} />
                      )}
                      <span className="location-suggestion-body">
                        <span className="location-suggestion-name">
                          {result.label}
                          {result.kind === 'spot' && asKm(result.distance_m) && (
                            <span className="location-suggestion-distance">
                              {asKm(result.distance_m)}
                            </span>
                          )}
                        </span>
                        {result.kind === 'spot' && (
                          <SpotCredit image={result.spot && result.spot.image} />
                        )}
                      </span>
                    </li>
                  ))}
                  {results[0].kind === 'spot' && (
                    /* Spot rows are OSM-derived, so ODbL requires the credit
                       wherever they are shown. Never a mixed list: Google is
                       only asked when the spot search returned nothing. */
                    <li className="list-group-item location-suggestions-credit">
                      © OpenStreetMap contributors
                    </li>
                  )}
                </ul>
              )}
            </div>

            {chips.length > 0 && !location_id && !search && (
              <div className="location-nearby">
                <div className="location-nearby-label">
                  {pin ? 'Spots near your location' : 'Spots near you'}
                </div>
                <div className="location-nearby-chips">
                  {chips.map(spot => (
                    <button
                      key={spot.id}
                      /* Bare buttons submit the react-advanced-form Form. */
                      type="button"
                      className="location-nearby-chip"
                      onClick={() => this.handleSelectSpot(spot)}
                    >
                      <SpotThumb image={spot.image} size={28} />
                      <span className="location-nearby-chip-text">
                        {spot.name}
                        {asKm(spot.distance_m) && (
                          <span className="location-nearby-distance">
                            {asKm(spot.distance_m)}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                {/* These names come from the Overpass-seeded spot table, so
                    ODbL requires the credit wherever they are shown. */}
                <div className="location-nearby-credit">
                  © OpenStreetMap contributors
                  {/* A 28px chip cannot carry a 279-character credit line, so
                      the photographers are named once for the row. */}
                  <PhotoCreditLine spots={chips} />
                </div>
              </div>
            )}

            {/* Google is now the fallback, not the field, so this can no
                longer say the lookup is unavailable - with no key the spot
                search still answers everywhere the seed has been run. */}
            {loadError && (
              <small className="form-text text-muted">
                Searching seeded surf spots only.
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
