import "./css/Board.css";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import MainContainer from "./../layout/MainContainer";
import CommunityScore from "./CommunityScore";
import { loadTopRatedBoards } from "./../../actions/board_rating";

const DEFAULT_LIMIT = 25;

const mapStateToProps = (state) => {
	return {
		session: state.session,
		top: state.board_ratings.top,
	};
};

const mapDispachToProps = (dispatch) => {
	return {
		loadTopRated: (session, limit) => dispatch(loadTopRatedBoards(session, limit)),
	};
};

/*
 * Models ranked by the shrunk score, not the raw average, and filtered server
 * side to those with enough riders to have one - so a model one person loved
 * cannot head this list.
 *
 * Catalog data, so it loads without a session. Nothing here is scoped to a
 * viewer and nothing here is a rider's own board.
 */
class TopRated extends Component {
	componentDidMount() {
		this.props.loadTopRated(this.props.session, DEFAULT_LIMIT);
	}

	render() {
		const top = this.props.top || [];
		return (
			<MainContainer>
				<div className="gw-title-block">
					<div className="gw-eyebrow">Community</div>
					<h1 className="gw-title">Best rated boards</h1>
					<div className="gw-community-blurb">
						Every rider who owns one gets a single vote, whatever
						size they ride and however many of them they own.
						Ordered by a score that pulls thin averages toward the
						middle until enough people have weighed in.
					</div>
				</div>

				{top.length === 0 ? (
					<div className="gw-empty">
						NOTHING RATED BY ENOUGH RIDERS YET
					</div>
				) : (
					<div className="gw-list">
						{top.map((row, index) => (
							<div className="gw-row" key={row.board_id}>
								<div className="gw-row-rank">{index + 1}</div>
								<div className="gw-row-body">
									<div className="gw-row-titleline">
										<div className="gw-row-title">{row.model}</div>
									</div>
									<div className="gw-row-meta">
										{[row.manufacturer, row.category].filter(Boolean).join(" · ")}
									</div>
								</div>
								<CommunityScore rating={row} />
							</div>
						))}
					</div>
				)}

				<div className="gw-list-foot">
					<Link className="gw-link" to={"/board"}>&larr; YOUR QUIVER</Link>
				</div>
			</MainContainer>
		);
	}
}
export default connect(mapStateToProps, mapDispachToProps)(TopRated);
