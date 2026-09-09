import React from "react";

// The artboard reserves cyan for anything over the 8.0 line, matching
// gw-row-rating.is-high on a rider's own score.
const HIGH_RATING = 8;

/*
 * The only thing in the app that renders a community score.
 *
 * It owns the seeded note as well as the number, because the note is a promise
 * the site makes about where those ratings came from, and a second component
 * reading `rating` off the payload on its own would quietly stop keeping it.
 * Render a score somewhere new by using this, never by formatting the field.
 *
 * `seeded` clears itself server side once the demo riders are gone, so nothing
 * here has to be removed at launch.
 */
const CommunityScore = (props) => {
	const rating = props.rating;
	const compact = Boolean(props.compact);
	const className = `gw-community${compact ? " is-compact" : ""}`;

	// No row in board_ratings at all: either nobody owns the model or the
	// request has not landed yet. Both read the same to a viewer.
	if (!rating) {
		return (
			<div className={className}>
				<div className="gw-community-score is-empty">--</div>
				{!compact && <div className="gw-community-label">Community</div>}
			</div>
		);
	}

	const riders = Number(rating.riders) || 0;
	const minRiders = Number(rating.min_riders) || 3;
	const withheld = rating.rating === null || rating.rating === undefined;
	const score = withheld ? null : Number(rating.rating);

	if (withheld) {
		return (
			<div className={className}>
				<div className="gw-community-score is-empty">--</div>
				<div className="gw-community-label">
					{riders === 0 ? "Not rated" : `${riders} of ${minRiders} riders`}
				</div>
			</div>
		);
	}

	return (
		<div className={className}>
			<div className={`gw-community-score${score >= HIGH_RATING ? " is-high" : ""}`}>
				{score.toFixed(1)}
			</div>
			<div className="gw-community-label">
				{riders} {riders === 1 ? "rider" : "riders"}
			</div>
			{rating.seeded && (
				<div className="gw-community-seeded">
					includes seeded demo riders
				</div>
			)}
		</div>
	);
};
export default CommunityScore;
