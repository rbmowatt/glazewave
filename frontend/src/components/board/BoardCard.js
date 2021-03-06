import React from "react";
import StarBar from "./../layout/StarBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { s3Conf } from "./../../config/s3";
import { withRouter } from "react-router";

const BoardCard = (props) => {
	return (
		<div className="container-fluid session-card" >
			<div className="row">
				<div className="col-12 board-card-title">
					<button
						className="btn btn-link card-title capitalize"
						onClick={() => props.history.push("/board/" + props.board.id)}
					>
						{props.board.name}
					</button>
				</div>
				<div className="col-4" onClick={()=>props.history.push("/board/" + props.board.id)}>
					<img
						className="img-responsive img-thumbnail img-card"
						alt=""
						src={
							props.board.UserBoardImages && props.board.UserBoardImages.length
								? s3Conf.root + props.board.UserBoardImages[0].name
								: "/img/board_default_lg.png"
						}
					/>
				</div>
				<div className="col-8">
				{ props.isOwner && 
					<div>
						{props.editBoard && (
							<FontAwesomeIcon
								size="lg"
								alt="edit user"
								style={{ marginLeft: ".1em", cursor: "pointer" }}
								icon={faEdit}
								onClick={() => props.editBoard(props.board.id)}
							/>
						)}
						{props.deleteBoard && (
							<FontAwesomeIcon
								size="lg"
								alt="delete user"
								style={{ marginLeft: ".5em", cursor: "pointer", color: "red" }}
								icon={faTrash}
								onClick={() => props.deleteBoard(props.board.id)}
							/>
						)}
					</div>
					}
					<div onClick={()=>props.history.push("/board/" + props.board.id)}>
					<div className="card-rating">
						<StarBar stars={props.board.rating} />
					</div>
					<div className="board-card-model">
						{props.board.size} {props.board.Board && props.board.Board.model}
					</div>
					</div>
				</div>
			</div>
		</div>
	);
};
export default withRouter(BoardCard);
