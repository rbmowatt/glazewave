import React from 'react'
import { createField, fieldPresets } from 'react-advanced-form'
import Autosuggest from 'react-autosuggest';



class TypeAheadInput extends React.Component {
  
    constructor(props)
    {
        super(props);
        this.state = {
            value: props.value || '',
            suggestions : props.entity
          };
    }
  
    onChange = (event, { newValue } ) => {
      console.log('key', newValue)
        if(this.state.value !== newValue)
        {
          this.setState({
            value: newValue
          });
        }
      };

      onBlur = (event) => {
        if(this.state.value)
        console.log('blur', event.target.value)
          let vid = this.props.entity.find(x => x[this.props.keyName] === event.target.value);
          this.props.setValue(this.props.name, vid ? vid.id : event.target.value)
        };
  

    getSuggestionValue = suggestion => suggestion[this.props.keyName];
  
    renderSuggestion = suggestion => (
        <div>
          {suggestion[this.props.keyName]}
        </div>
      );

    // Autosuggest will call this function every time you need to update suggestions.
    // You already implemented this logic above, so just use it.
    onSuggestionsFetchRequested = ({ value, reason }) => {
      this.setState({
        suggestions: this.props.getSuggestions(value, reason)
      });
    };

    // Autosuggest will call this function every time you need to clear suggestions.
    onSuggestionsClearRequested = () => {
      this.setState({
        suggestions: []
      });
    };

    onSuggestionSelected = (event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) =>
    {
      console.log(event.target);
      //let vid = this.props.entity.find(x => x[this.props.keyName] === newValue);
      this.props.setValue(this.props.name, suggestion.id)
    }

    shouldRenderSuggestions = (value) => {
      return true
    }

  render() {
    const { fieldProps, fieldState, id, name, label, hint } = this.props
    const { value, suggestions } = this.state;

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
        value,
        onBlur: this.onBlur,
        onChange: this.onChange,
        onFocus : ()=>this.onSuggestionsFetchRequested({value : name , reason : 'type_ahead_focused'}),
        id: name,
        name,
        className: inputClassNames,
        autoComplete: "off"
      };

    const wrapperClass = this.props.display ? "sc-bxivhb eTopIC" : "sc-bxivhb eTopIC d-none";

    return (
      <div className={wrapperClass}>
        {label && (
          <label className="sc-bwzfXH dybocD" htmlFor={id || name}>
            {label}
            {required && ' *'}
          </label>
        )}


        <div className="sc-ifAKCX fatWUN" style={{'maxHeight':200, overflow:'auto'}}>
        <Autosuggest 
                suggestions={suggestions}
                onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                getSuggestionValue={this.getSuggestionValue}
                renderSuggestion={this.renderSuggestion}
                inputProps={inputProps}
                onSuggestionSelected={this.onSuggestionSelected}
                onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                shouldRenderSuggestions={this.shouldRenderSuggestions}
                //focusInputOnSuggestionClick={false}
                //alwaysRenderSuggestions={true}
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

export default createField(fieldPresets.input)(TypeAheadInput)