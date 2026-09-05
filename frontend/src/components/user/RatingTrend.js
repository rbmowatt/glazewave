import React from "react";
import moment from "moment";

const W = 620;
const H = 196;
const MONTHS = 12;
const MAX_RATING = 10;

// Sessions arrive from the dashboard's own store slice, which holds every
// session for the user -- the DASHBOARD_LIST_LIMIT is applied at render, not
// in the request, so there is no extra call to make here.
const monthlyAverages = (sessions) => {
	const start = moment().startOf("month").subtract(MONTHS - 1, "months");
	const buckets = new Array(MONTHS).fill(null).map(() => ({ sum: 0, count: 0 }));

	sessions.forEach((session) => {
		const rating = Number(session.rating);
		if (!rating) return;
		const index = moment(session.createdAt).startOf("month").diff(start, "months");
		if (index < 0 || index >= MONTHS) return;
		buckets[index].sum += rating;
		buckets[index].count += 1;
	});

	return buckets.map((bucket, index) => ({
		label: moment(start).add(index, "months").format("MMM").toUpperCase(),
		value: bucket.count ? bucket.sum / bucket.count : null,
	}));
};

const toPoints = (series) =>
	series
		.map((point, index) => ({
			x: series.length === 1 ? W / 2 : (index / (series.length - 1)) * W,
			y: H - (point.value / MAX_RATING) * H,
			value: point.value,
		}))
		.filter((point) => point.value !== null);

// Catmull-Rom through the points, converted to cubic beziers.
const smoothPath = (points) => {
	if (points.length < 2) return "";
	let d = `M${points[0].x},${points[0].y}`;
	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[i - 1] || points[i];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[i + 2] || p2;
		const c1x = p1.x + (p2.x - p0.x) / 6;
		const c1y = p1.y + (p2.y - p0.y) / 6;
		const c2x = p2.x - (p3.x - p1.x) / 6;
		const c2y = p2.y - (p3.y - p1.y) / 6;
		d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
	}
	return d;
};

const RatingTrend = (props) => {
	const sessions = props.sessions || [];
	const series = monthlyAverages(sessions);
	const points = toPoints(series);
	const rated = sessions.filter((session) => Number(session.rating)).length;

	return (
		<div className="d-flex flex-column" style={{ gap: "24px" }}>
			<div className="gw-trend-head">
				<div>
					<div className="gw-trend-title">Session ratings</div>
					<div className="gw-trend-sub">ROLLING 12 MONTHS &middot; ALL BOARDS</div>
				</div>
				<div className="gw-mono" style={{ fontSize: "11px", color: "#93a5ac" }}>
					{rated} RATED
				</div>
			</div>

			{points.length < 2 ? (
				<div className="gw-trend-empty">
					NOT ENOUGH RATED SESSIONS IN THE LAST 12 MONTHS TO PLOT A TREND
				</div>
			) : (
				<React.Fragment>
					<div className="gw-trend-plot">
						<svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
							<defs>
								<linearGradient id="gwfill" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#3fd0dd" stopOpacity="0.34" />
									<stop offset="100%" stopColor="#3fd0dd" stopOpacity="0" />
								</linearGradient>
							</defs>
							<line x1="0" y1="49" x2={W} y2="49" stroke="#151d22" />
							<line x1="0" y1="98" x2={W} y2="98" stroke="#151d22" />
							<line x1="0" y1="147" x2={W} y2="147" stroke="#151d22" />
							<path
								d={`${smoothPath(points)} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`}
								fill="url(#gwfill)"
							/>
							<path d={smoothPath(points)} fill="none" stroke="#3fd0dd" strokeWidth="2" />
						</svg>
						<div className="gw-trend-axis" style={{ top: "-4px" }}>10</div>
						<div className="gw-trend-axis" style={{ top: "92px" }}>5</div>
					</div>
					<div className="gw-trend-months">
						{series.map((point, index) => (
							<div key={index}>{point.label}</div>
						))}
					</div>
				</React.Fragment>
			)}
		</div>
	);
};

export default RatingTrend;
