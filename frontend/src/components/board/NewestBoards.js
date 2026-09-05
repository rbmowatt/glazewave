import React from "react";
import BoardCard from "./BoardCard";
import { Link } from 'react-router-dom';

export const NewestBoards = (props) => {
	const boards = props.boards || [];
	return (
		<div>
			<div className="gw-list-head">
				<div className="gw-eyebrow">Quiver</div>
				{boards.length > 0 &&
					<Link className="gw-link" to={'/board'}>ALL {boards.length} &rarr;</Link>
				}
			</div>
			{boards.length === 0 ? (
				<div className="gw-empty">
					NO BOARDS YET
					<br />
					<Link className="gw-link" to={'/board/create'}>ADD YOUR FIRST BOARD &rarr;</Link>
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
