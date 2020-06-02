import React, {Component} from "react"
import ReactGoogleMapLoader from "react-google-maps-loader"
import ReactGooglePlacesSuggest from "react-google-places-suggest"
import { createField, fieldPresets } from 'react-advanced-form'
import { Input } from 'react-advanced-form-addons';
 
const MY_API_KEY = "AIzaSyBaaD_720jqJaoIBsQib_N79Q5_iciLRBc" // fake
 
class Location extends Component {
    state = {
        search: "",
        value: "",
        location_id : ""
    }
 
    handleInputChange = e => {
        this.setState({search: e.target.value, value: e.target.value}) 
    }
 
    handleSelectSuggest = (geocodedPrediction, originalPrediction) => {
       console.log(geocodedPrediction, originalPrediction) // eslint-disable-line
        this.setState({
            search: "",
            value: geocodedPrediction.formatted_address,
            location_id : geocodedPrediction.place_id
        })
        this.props.onChange('location_id', geocodedPrediction.place_id);
    }
 
    handleNoResult = () => {
        console.log("No results for ", this.state.search)
    }
 
    handleStatusUpdate = status => {
        console.log(status)
    }
 
    render() {
        const {search, value, location_id} = this.state
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
          'sc-EHOje fVJbnH'
        ]
          .filter(Boolean)
          .join(' ')
    
          const inputProps = {
            ...fieldProps,
            className: inputClassNames,
            autoComplete: "off"
          };
    
        const wrapperClass = !this.props.display ? "sc-bxivhb eTopIC" : "sc-bxivhb eTopIC d-none";
    
        return (
          <div className={wrapperClass}>
            {label && (
              <label className="sc-bwzfXH dybocD" htmlFor={id || name}>
                {label}
                {required && ' *'}
              </label>
            )}
            <div className="sc-ifAKCX fatW</div>UN">
            <ReactGoogleMapLoader
                params={{
                    key: MY_API_KEY,
                    libraries: "places,geocode",
                }}
                render={googleMaps =>
                    googleMaps && (
                        <ReactGooglePlacesSuggest
                            googleMaps={googleMaps}
                            autocompletionRequest={{
                                input: search,
                                // Optional options
                                // https://developers.google.com/maps/documentation/javascript/reference?hl=fr#AutocompletionRequest
                            }}
                            // Optional props
                            onNoResult={this.handleNoResult}
                            onSelectSuggest={this.handleSelectSuggest}
                            onStatusUpdate={this.handleStatusUpdate}
                            textNoResults="My custom no results text" // null or "" if you want to disable the no results item
                            customRender={prediction => (
                                <div className="customWrapper">
                                    {prediction
                                        ? prediction.description
                                        : "My custom no results text"}
                                </div>
                            )}
                        >
                            <input
                                {...inputProps}
                                type="text"
                                autoComplete="off"
                                value={value}
                                placeholder="Search a location"
                                onChange={this.handleInputChange}
                            />
                        </ReactGooglePlacesSuggest>
                    )
                }
            />
       </div>


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