import React from "react";
import { createField, fieldPresets } from "react-advanced-form";
import Autosuggest from "react-autosuggest";
import "./css/TypeAhead.css";

class TypeAheadInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.value || "",
      suggestions: props.entity,
    };
  }

  onChange = (event, { newValue }) => {
    if (this.state.value !== newValue) {
      this.setState({
        value: newValue,
      });
    }
  };

  onBlur = (event) => {
    if (this.state.value) /* console.log removed */;
    let vid = this.props.entity.find(
      (x) => x[this.props.keyName] === event.target.value
    );
    this.props.setValue(this.props.name, vid ? vid.id : event.target.value);
  };

  getSuggestionValue = (suggestion) => suggestion[this.props.keyName];

  renderSuggestion = (suggestion) => (
    <div>{suggestion[this.props.keyName]}</div>
  );

  /*
  Autosuggest fires this on focus with whatever is already in the input, which
  would narrow the list to the one row the field already holds. Clicking into
  the field is a request to see the whole list, so the search is forced empty
  for that reason and the typed value is used for every other.
  */
  onSuggestionsFetchRequested = ({ value, reason }) => {
    const search = reason === "input-focused" ? "" : value;
    this.setState({
      suggestions: this.props.getSuggestions(search, reason),
    });
  };

  // Autosuggest will call this function every time we need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  onSuggestionSelected = (
    event,
    { suggestion, /*suggestionValue, suggestionIndex, sectionIndex, method*/ }
  ) => {
    this.props.setValue(this.props.name, suggestion.id);
  };

  shouldRenderSuggestions = (value) => {
    return true;
  };

  render() {
    const { fieldProps, fieldState, id, name, label, hint } = this.props;
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
    } = fieldState;

    const inputClassNames = [
      "form-control",
      touched && "is-touched",
      pristine && "is-pristine",
      validating && "is-validating",
      validatedSync && "validated-sync",
      validatedAsync && "validated-async",
      valid && "is-valid",
      validSync && "valid-sync",
      validAsync && "valid-async",
      invalid && "is-invalid",
    ]
      .filter(Boolean)
      .join(" ");

    const inputProps = {
      ...fieldProps,
      value,
      onBlur: this.onBlur,
      onChange: this.onChange,
      id: name,
      name,
      className: inputClassNames,
      autoComplete: "off",
    };

    /*
    These used to be "sc-bxivhb", "sc-bwzfXH dybocD" and "sc-ifAKCX fatWUN":
    styled-components class names copied out of a react-advanced-form-addons
    build. The addons generate those at runtime and the hash changes with the
    styles, so the frozen copies matched nothing and this field rendered with no
    layout at all while the addons' own Input beside it laid out fine.

    The wrapper around Autosuggest also carried an inline maxHeight/overflow,
    which is what put a horizontal scrollbar across the bottom of the create
    modal and clipped the suggestion list to 200px inside the field. The list
    overlays now, the same way the location field's does.
    */
    const wrapperClass = this.props.display
      ? "gw-field"
      : "gw-field d-none";

    return (
      <div className={wrapperClass}>
        {label && (
          <label className="gw-field-label" htmlFor={id || name}>
            {label}
            {required && <span className="gw-field-req">*</span>}
          </label>
        )}
        <div className="gw-typeahead">
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
    );
  }
}

export default createField(fieldPresets.input)(TypeAheadInput);
