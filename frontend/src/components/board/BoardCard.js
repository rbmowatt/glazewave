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

	const meta = [
		board.Board && board.Board.model,
		board.size,
	].filter(Boolean).join(" · ");

	const rating = Number(board.rating) || 0;

	return (
		<div className="gw-row">
			<img className="gw-row-thumb" alt={board.name} src={image} onClick={open} />
			<div className="gw-row-body" onClick={open}>
				<div className="gw-row-title">{board.name}</div>
				<div className="gw-row-meta">{meta}</div>
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
			<div className={`gw-row-rating${rating >= HIGH_RATING ? " is-high" : ""}`} onClick={open}>
				{rating ? rating.toFixed(1) : "--"}
			</div>
		</div>
	);
};
export default withRouter(BoardCard);
