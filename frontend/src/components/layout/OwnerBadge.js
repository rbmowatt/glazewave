import React from "react";
import { s3Conf } from "./../../config/s3";

/*
The API only sends User when the caller asked for it in `withs`, so this renders
nothing rather than a blank chip on the pages that do not (the dashboard lists,
which are all the rider's own anyway).

profile_img is a bare S3 key, the same shape the navbar avatar uses. A rider
with no photo gets the empty circle instead of a broken image.
*/
const OwnerBadge = ({ user, label }) => {
	if (!user) return null;
	const name = user.username || user.first_name || "Unknown rider";
	return (
		<div className="gw-owner">
			{user.profile_img ? (
				<img
					className="gw-owner-avatar"
					src={s3Conf.root + user.profile_img}
					alt=""
				/>
			) : (
				<span className="gw-owner-avatar" />
			)}
			<span className="gw-owner-name">{label ? `${label} ${name}` : name}</span>
		</div>
	);
};

export default OwnerBadge;
