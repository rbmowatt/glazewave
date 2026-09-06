import "./../css/BoardSelect.css";
import React from "react";

/*
Replaces the riec InlineEdit that used to sit here. That component rendered the
current value as a bare <span>, so the only clickable pixels were the width of
the board name itself, and clicking it swapped in a native <select> — the OS
dropdown, not this app's styling. It also compared option ids against the value
it was handed, which BoardPicker passed as a name, so the native select never
had a matching option and always opened on the first board.

Rendered value is the id here. The label comes from the options list.
*/
class BoardSelect extends React.Component {
	constructor(props) {
		super(props);
		this.state = { open: false, active: -1 };
		this.rootRef = React.createRef();
		this.listRef = React.createRef();
	}

	componentDidMount() {
		document.addEventListener("mousedown", this.onDocumentMouseDown);
	}

	componentWillUnmount() {
		document.removeEventListener("mousedown", this.onDocumentMouseDown);
	}

	onDocumentMouseDown = (e) => {
		if (!this.state.open) return;
		if (this.rootRef.current && this.rootRef.current.contains(e.target)) return;
		this.setState({ open: false, active: -1 });
	};

	selectedIndex = () => {
		const id = Number(this.props.value);
		if (!id) return -1;
		return this.props.options.findIndex((o) => Number(o.id) === id);
	};

	selectedLabel = () => {
		const i = this.selectedIndex();
		return i === -1 ? this.props.placeholder : this.props.options[i].name;
	};

	open = () => {
		if (this.props.disabled) return;
		const i = this.selectedIndex();
		this.setState({ open: true, active: i === -1 ? 0 : i }, this.scrollActiveIntoView);
	};

	close = () => this.setState({ open: false, active: -1 });

	toggle = () => (this.state.open ? this.close() : this.open());

	choose = (option) => {
		this.close();
		if (this.buttonRef) this.buttonRef.focus();
		if (Number(option.id) === Number(this.props.value)) return;
		this.props.onChange(option.id);
	};

	scrollActiveIntoView = () => {
		const list = this.listRef.current;
		if (!list) return;
		const el = list.children[this.state.active];
		if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
	};

	move = (delta) => {
		const count = this.props.options.length;
		if (!count) return;
		const next = (this.state.active + delta + count) % count;
		this.setState({ active: next }, this.scrollActiveIntoView);
	};

	onKeyDown = (e) => {
		if (this.props.disabled) return;

		if (!this.state.open) {
			if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				this.open();
			}
			return;
		}

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				this.move(1);
				break;
			case "ArrowUp":
				e.preventDefault();
				this.move(-1);
				break;
			case "Home":
				e.preventDefault();
				this.setState({ active: 0 }, this.scrollActiveIntoView);
				break;
			case "End":
				e.preventDefault();
				this.setState({ active: this.props.options.length - 1 }, this.scrollActiveIntoView);
				break;
			case "Enter":
			case " ":
				e.preventDefault();
				if (this.props.options[this.state.active])
					this.choose(this.props.options[this.state.active]);
				break;
			case "Escape":
				e.preventDefault();
				this.close();
				break;
			case "Tab":
				this.close();
				break;
			default:
				break;
		}
	};

	render() {
		const { options, disabled } = this.props;
		const { open, active } = this.state;
		const selected = this.selectedIndex();

		return (
			<div className="board-select-root" ref={this.rootRef}>
				<button
					/* Bare buttons submit an enclosing form. */
					type="button"
					ref={(el) => (this.buttonRef = el)}
					className={"board-select-control" + (open ? " is-open" : "")}
					onClick={this.toggle}
					onKeyDown={this.onKeyDown}
					disabled={disabled}
					aria-haspopup="listbox"
					aria-expanded={open}
				>
					<span
						className={
							"board-select-value" + (selected === -1 ? " is-placeholder" : "")
						}
					>
						{this.selectedLabel()}
					</span>
					{!disabled && <span className="board-select-caret" aria-hidden="true" />}
				</button>

				{open && (
					<ul className="board-select-menu" role="listbox" ref={this.listRef}>
						{options.length === 0 && (
							<li className="board-select-empty">No boards yet</li>
						)}
						{options.map((option, i) => (
							<li
								key={option.id}
								role="option"
								aria-selected={i === selected}
								className={
									"board-select-option" +
									(i === active ? " is-active" : "") +
									(i === selected ? " is-selected" : "")
								}
								/* mousedown, so the choice lands before the button's blur. */
								onMouseDown={(e) => {
									e.preventDefault();
									this.choose(option);
								}}
								onMouseEnter={() => this.setState({ active: i })}
							>
								{option.name}
							</li>
						))}
					</ul>
				)}
			</div>
		);
	}
}

BoardSelect.defaultProps = {
	options: [],
	placeholder: "Select a board",
	disabled: false,
};

export default BoardSelect;
