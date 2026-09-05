import React from "react";

/*
 * Replaces the react-advanced-form Radio pair the index pages used. The
 * onChange contract is kept as {nextValue} because setScope on both index
 * pages parses that shape.
 */
const OPTIONS = [
	{ value: "0", label: "Just mine" },
	{ value: "1", label: "Mine + public" },
];

const ScopePicker = (props) => (
	<div>
		<div className="gw-eyebrow mb-2">Scope</div>
		<div className="gw-scope">
			{OPTIONS.map((option) => {
				const active = String(props.value) === option.value;
				return (
					<label
						className={`gw-scope-option${active ? " is-active" : ""}`}
						key={option.value}
					>
						<input
							type="radio"
							name={props.name}
							value={option.value}
							checked={active}
							onChange={() => props.onChange({ nextValue: option.value })}
						/>
						<span className="gw-scope-dot" />
						<span>{option.label}</span>
					</label>
				);
			})}
		</div>
	</div>
);

export default ScopePicker;
