import React, {Component} from "react"
import ReactGoogleMapLoader from "react-google-maps-loader"
import ReactGooglePlacesSuggest from "react-google-places-suggest"
import { createField, fieldPresets } from 'react-advanced-form'
import { getSessionData} from './../reports/stormglass/helpers/session';
import googleConfig from './../../config/google';

 
class Location extends Component {
    state = {
        search: "",
        value: "",
        location_id : "",
        is_editing : false
    }
 
    handleInputChange = e => {
        this.setState({search: e.target.value, value: e.target.value, is_editing : true}) 
    }
 
    handleSelectSuggest = (geocodedPrediction, originalPrediction) => {
        this.setState({
            search: "",
            value: geocodedPrediction.formatted_address,
            location_id : geocodedPrediction.place_id
        })
        this.props.onChange('location_id', geocodedPrediction.place_id);
        this.setState({is_editing : false});
        getSessionData(geocodedPrediction.geometry.location.lat(),geocodedPrediction.geometry.location.lng())
            .then(d=>{ if (d) this.props.onChange('conditions', d); })
            .catch(()=>{})
    }
 
    handleNoResult = () => {
    }
 
    handleStatusUpdate = status => {
     // this.setState({is_editing : true});
    }

    onBlur = (e)=>
    {
      
      if(this.state.is_editing){
        this.setState({
          value: '',
          is_editing : false
        })
      }
    }
 
    render() {
      //if(this.props.disable && this.props.disable === true){
        //return  <div className="sc-ifAKCX">{this.props.placeholder}</div>
     // }
        const {search, value} = this.state
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
          'google-locations-input',
          'sc-EHOje fVJbnH'
        ]
          .filter(Boolean)
          .join(' ')
    
          const inputProps = {
            ...fieldProps,
            className: inputClassNames,
            autoComplete: "off"
          };
    
        const wrapperClass = !this.props.display ? "sc-bxivhb" : "sc-bxivhb d-none";
    
        return (
          <div className={wrapperClass}>
            {label && (
              <label className="sc-bwzfXH dybocD" htmlFor={id || name}>
                {label}
                {required && ' *'}
              </label>
            )}
            <div className="sc-ifAKCX">
            <ReactGoogleMapLoader
                params={{
                    // Build-time inlined, so a key change is a rebuild. With no
                    // key the loader never resolves, googleMaps stays null and
                    // the render callback below emits nothing at all - the
                    // location field disappears rather than degrading to a
                    // plain text input.
                    key: googleConfig.api_key,
                    libraries: "places,geocode",
                }}
                render={googleMaps =>
                    googleMaps && (
                        <ReactGooglePlacesSuggest
                            googleMaps={googleMaps}
                            autocompletionRequest={{
                                input: search,
                                //types: ['(route)']
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
                                    {this.locRender(prediction)}
                                </div>
                            )}
                        >
                            <input
                                {...inputProps}
                                type="text"
                                autoComplete="off"
                                value={value}
                                onBlur={this.onBlur}
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
locRender = (prediction)=>{
  return prediction.types.indexOf("route") !== -1
  ? prediction.description
  : null}
}

export default createField(fieldPresets.input)(Location)