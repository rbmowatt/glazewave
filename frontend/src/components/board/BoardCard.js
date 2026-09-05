import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { s3Conf } from "./../../config/s3";
import { withRouter } from "react-router";

const HIGH_RATING = 8;

const BoardCard = (props) => {
	const { board } = props;
	const open = () => props.history.push("/board/" + board.id);
	const image = board.UserBoardImages && board.UserBoardImages.length
		? s3Conf.root + board.UserBoardImages[0].name
		: "/img/board_default_lg.png";

	// Manufacturer only arrives when the caller asked for "Board.Manufacturer";
	// the dashboard asks for "Board" alone.
	const manufacturer = board.Board && board.Board.Manufacturer && board.Board.Manufacturer.name;
	const meta = (props.detailed
		? [manufacturer, board.Board && board.Board.model]
		: [board.Board && board.Board.model, board.size]
	).filter(Boolean).join(" · ");

	const rating = Number(board.rating) || 0;
	const isPublic = Number(board.is_public) === 1;

	const cells = [];
	if (props.detailed && board.size) cells.push(`SIZE ${board.size}`);

	return (
		<div className={`gw-row${props.detailed ? " gw-row-lg" : ""}`}>
			<img className="gw-row-thumb" alt={board.name} src={image} onClick={open} />
			<div className="gw-row-body" onClick={open}>
				<div className="gw-row-titleline">
					<div className="gw-row-title">{board.name}</div>
					{props.detailed &&
						<div className={`gw-row-tag${isPublic ? " is-public" : ""}`}>
							{isPublic ? "Public" : "Private"}
						</div>
					}
				</div>
				<div className="gw-row-meta">{meta}</div>
				{cells.length > 0 &&
					<div className="gw-row-stats">
						{cells.map(cell => <div key={cell}>{cell}</div>)}
					</div>
				}
			</div>
			{props.isOwner &&
				<div className="gw-row-actions">
					{props.editBoard &&
						<FontAwesomeIcon alt="edit board" icon={faEdit}
							onClick={() => props.editBoard(board.id)} />
					}
					{props.deleteBoard &&
						<FontAwesomeIcon alt="delete board" icon={faTrash}
							onClick={() => props.deleteBoard(board.id)} />
					}
				</div>
			}
			{props.detailed ? (
				<div className="gw-row-score" onClick={open}>
					<div className={`gw-row-rating${rating >= HIGH_RATING ? " is-high" : ""}`}>
						{rating ? rating.toFixed(1) : "--"}
					</div>
					<div className="gw-row-score-label">Avg</div>
				</div>
			) : (
				<div className={`gw-row-rating${rating >= HIGH_RATING ? " is-high" : ""}`} onClick={open}>
					{rating ? rating.toFixed(1) : "--"}
				</div>
			)}
		</div>
	);
};
export default withRouter(BoardCard);
