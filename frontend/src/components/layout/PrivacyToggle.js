import React from "react";

/*
 * Replaces the react-advanced-form-addons Radio pair. That control renders its
 * own dot as a styled-components span with a hashed class, which could not be
 * aligned against the label without fighting a per-build selector.
 *
 * onChange keeps the {nextValue} shape the view's handler already parses.
 */
const OPTIONS = [
	{ value: "0", label: "Private" },
	{ value: "1", label: "Public" },
];

const PrivacyToggle = (props) => (
	<div className="gw-segmented">
		{OPTIONS.map((option) => {
			const active = String(props.value) === option.value;
			return (
				<button
					type="button"
					key={option.value}
					className={`gw-segment${active ? " is-active" : ""}`}
					aria-pressed={active}
					onClick={() => props.onChange({ nextValue: option.value })}
				>
					{option.label}
				</button>
			);
		})}
	</div>
);

export default PrivacyToggle;
