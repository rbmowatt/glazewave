import React from "react";
import BoardCard from "./BoardCard";
import { Link } from 'react-router-dom';

export const NewestBoards = (props) => {
	const boards = props.boards || [];
	// The list request caps at 20 rows, so its length is a page size and not a
	// total. The count comes off the server aggregation instead.
	const total = (props.total === undefined || props.total === null)
		? boards.length
		: props.total;
	return (
		<div>
			<div className="gw-list-head">
				<div className="gw-eyebrow">Quiver</div>
				{boards.length > 0 &&
					<Link className="gw-link" to={'/board'}>ALL {total} &rarr;</Link>
				}
			</div>
			{boards.length === 0 ? (
				<div className="gw-empty">
					NO BOARDS YET
					<br />
					<button type="button" className="gw-link" onClick={props.onAddBoard}>
						ADD YOUR FIRST BOARD &rarr;
					</button>
				</div>
			) : (
				<div className="gw-list">
					{boards.slice(0, props.limit).map(board => (
						<BoardCard board={board} key={board.id} />
					))}
				</div>
			)}
		</div>
	);
};
