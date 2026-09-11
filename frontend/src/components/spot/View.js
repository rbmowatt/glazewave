import "./css/Spot.css";
import React, { Component } from "react";
import { connect } from "react-redux";
import ImageGallery from "react-image-gallery";
import MainContainer from "./../layout/MainContainer";
import Modal from "./../layout/Modal";
import { FormCard } from "./../layout/FormCard";
import { SpotCredit } from "./SpotImage";
import NoteThread from "./NoteThread";
import { isReadOnly } from "./../../lib/utils/demo";
import {
	loadSpot,
	loadSpotPhotos,
	loadSpotNotes,
	addSpotNote,
	deleteSpotNote,
	saveSpotDescription,
	clearSpot,
} from "./../../actions/spot";

const mapStateToProps = (state) => {
	return {
		session: state.session,
		spot: state.spot.selected,
		notFound: state.spot.notFound,
		photos: state.spot.photos,
		notes: state.spot.notes,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		loadSpot: (session, id, width) => dispatch(loadSpot(session, id, width)),
		loadPhotos: (session, id) => dispatch(loadSpotPhotos(session, id)),
		loadNotes: (session, id) => dispatch(loadSpotNotes(session, id)),
		addNote: (session, id, params) => dispatch(addSpotNote(session, id, params)),
		deleteNote: (session, id) => dispatch(deleteSpotNote(session, id)),
		saveDescription: (session, id, body) => dispatch(saveSpotDescription(session, id, body)),
		clearSpot: () => dispatch(clearSpot()),
	};
};

// The gallery asks for the hero rung. A spot whose source photo is narrower
// gets its own largest one back - SpotImageService never rounds up to a key it
// did not build - so the width in the response is the truth, not this number.
const HERO_WIDTH = 1600;

class SpotView extends Component {
	state = { editingDescription: false, draft: "", showMap: false };

	/*
	 * The id is `:id+`, not `:id`. Spot ids are not all one path segment -
	 * osm:node/357717358 has a slash, a Google place id does not - and
	 * react-router hands the whole tail back with the slashes intact.
	 */
	spotId = () => this.props.match.params.id;

	showMap = () => this.setState({ showMap: true });
	hideMap = () => this.setState({ showMap: false });

	/*
	 * lat and lon are VARCHAR on surfline_spots, so they arrive as strings and a
	 * bad row yields NaN rather than throwing - which would put the string
	 * "NaN" in the bbox and render a map of nowhere. The geo GEOMETRY column is
	 * not an alternative: the parked Surfline import wrote it [lat, lon].
	 */
	coords = () => {
		const spot = this.props.spot;
		if (!spot) return null;
		const lat = Number(spot.lat);
		const lon = Number(spot.lon);
		return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
	};

	// The OSM embed takes a bounding box, not a centre and a zoom. Roughly two
	// kilometres across at these latitudes, which holds the break and the
	// paddle-out without losing the coastline.
	embedUrl = ({ lat, lon }) => {
		const pad = 0.01;
		const bbox = [lon - pad, lat - pad, lon + pad, lat + pad].join(",");
		return "https://www.openstreetmap.org/export/embed.html"
			+ "?bbox=" + encodeURIComponent(bbox)
			+ "&layer=mapnik&marker=" + encodeURIComponent(lat + "," + lon);
	};

	componentDidMount() {
		this.load(this.spotId());
	}

	/*
	 * A spot page can navigate straight to another spot without unmounting,
	 * through a link in the notes or the nearby list. Without this the URL
	 * changes and the page keeps the previous spot's photographs and thread.
	 */
	componentDidUpdate(prevProps) {
		if (prevProps.match.params.id !== this.props.match.params.id) {
			this.load(this.spotId());
		}
	}

	load(id) {
		this.props.clearSpot();
		this.props.loadSpot(this.props.session, id, HERO_WIDTH);
		this.props.loadPhotos(this.props.session, id);
		this.props.loadNotes(this.props.session, id);
	}

	returnToIndex = () => {
		this.props.history.length > 1
			? this.props.history.goBack()
			: this.props.history.push("/session");
	};

	/*
	 * features{} comes off the server, not off anything the bundle decides.
	 * Every flagged endpoint answers 404 while its flag is off, so a page that
	 * guessed would paint a section header over a request that cannot succeed.
	 */
	features = () => (this.props.spot && this.props.spot.features) || {};

	canWrite = () =>
		Boolean(this.props.session.isLoggedIn) && !isReadOnly(this.props.session);

	startEdit = () => {
		this.setState({
			editingDescription: true,
			draft: (this.props.spot && this.props.spot.notes) || "",
		});
	};

	saveDescription = (e) => {
		e.preventDefault();
		const body = this.state.draft.trim();
		if (!body) return;
		this.props.saveDescription(this.props.session, this.spotId(), body);
		this.setState({ editingDescription: false });
	};

	onAddNote = (params) => {
		// The POST answers with the row and no User - the handler has the token,
		// not the profile - so the author travels with the action and the
		// reducer attaches it. Otherwise a rider's own note renders nameless
		// until the next load.
		const viewer = this.props.session.user || {};
		this.props.addNote(this.props.session, this.spotId(), {
			...params,
			user: { id: viewer.id, first_name: viewer.first_name, username: viewer.userName },
		});
	};

	galleryItems = () =>
		(this.props.spot.images || []).map((image) => ({
			original: image.url,
			thumbnail: image.url,
			originalHeight: image.height,
			originalWidth: image.width,
		}));

	renderDescription() {
		const spot = this.props.spot;
		const canEdit = this.features().spot_description_edits && this.canWrite();

		if (this.state.editingDescription) {
			return (
				<form className="gw-desc-form" onSubmit={this.saveDescription}>
					<textarea
						className="gw-note-input"
						maxLength={4000}
						value={this.state.draft}
						onChange={(e) => this.setState({ draft: e.target.value })}
					/>
					<button className="gw-btn" type="submit" disabled={!this.state.draft.trim()}>
						Save
					</button>
					<button
						className="gw-link-btn"
						type="button"
						onClick={() => this.setState({ editingDescription: false })}
					>
						Cancel
					</button>
				</form>
			);
		}

		return (
			<div className="gw-desc">
				{spot.notes ? (
					<p className="gw-desc-text">{spot.notes}</p>
				) : (
					/*
					 * Nothing is generated into this space. Only `bottom` is
					 * populated across the table - county, break_type,
					 * wave_direction, difficulty and hazards are empty on all
					 * 1,620 rows - so a stub would restate the header, and it
					 * would read as written, which is what stops somebody
					 * writing a real one.
					 */
					<p className="gw-empty">
						{canEdit
							? "Nobody has described this spot yet."
							: "No description yet."}
					</p>
				)}
				{canEdit && (
					<button className="gw-link-btn" onClick={this.startEdit}>
						{spot.notes ? "Edit description" : "Write the first one"}
					</button>
				)}
			</div>
		);
	}

	render() {
		const spot = this.props.spot;
		// selected is null both in flight and after a 404, so notFound is what
		// separates a slow load from a dead link. Neither renders an empty spot
		// with blank fields.
		if (!spot) {
			return (
				<MainContainer>
					<FormCard returnToIndex={this.returnToIndex}>
						<div className="container gw-spot-page">
							{this.props.notFound && (
								<p className="gw-empty">
									That spot is not in the atlas. Sessions logged before a place
									was added keep their own location, which has no page.
								</p>
							)}
						</div>
					</FormCard>
				</MainContainer>
			);
		}

		const features = this.features();
		const viewer = this.props.session.user || {};
		const images = spot.images || [];

		return (
			<MainContainer>
				<FormCard returnToIndex={this.returnToIndex}>
					<div className="container gw-spot-page">
						<div className="row details">
							<div className="col-12 session-title">
								<h1 className="gw-title-field">{spot.name}</h1>
								<div className="gw-spot-facts">
									{spot.bottom && (
										<span className="gw-chip">{spot.bottom} bottom</span>
									)}
									{spot.break_type && <span className="gw-chip">{spot.break_type}</span>}
									{spot.difficulty && <span className="gw-chip">{spot.difficulty}</span>}
									{/* The modal needs coordinates, not spot.url, so a row
									    without usable ones falls back to the outbound link
									    rather than opening an empty map. */}
									{this.coords() ? (
										<button
											type="button"
											className="gw-chip gw-chip-link"
											onClick={this.showMap}
										>
											Map
										</button>
									) : spot.url && (
										<a
											className="gw-chip gw-chip-link"
											href={spot.url}
											target="_blank"
											rel="noopener noreferrer"
										>
											Map
										</a>
									)}
								</div>
							</div>
						</div>

						<div className="row">
							<div className="preview col-md-6">
								{images.length ? (
									<div>
										<ImageGallery
											items={this.galleryItems()}
											showBullets={images.length > 1}
											showThumbnails={images.length > 1}
											showIndex={images.length > 1}
											showPlayButton={false}
											showNav={images.length > 1}
										/>
										{/*
										  * 1,120 of the 1,322 default photographs are CC BY or
										  * CC BY-SA and the credit has to appear wherever the
										  * image does. Attribution.js in the footer covers OSM
										  * and Open-Meteo and does not satisfy that.
										  */}
										<SpotCredit image={images[0]} className="gw-spot-credit gw-spot-credit-hero" />
									</div>
								) : (
									/*
									 * 298 of 1,620 spots have no photograph - 289 from the OSM
									 * seed and all 9 user-added ones. That is 18%, so this is
									 * an ordinary state, not an error.
									 */
									<div className="gw-spot-hero-empty">
										<svg viewBox="0 0 24 24" className="gw-spot-hero-mark" focusable="false">
											<path d="M2 13c2.4 0 2.4-2.2 4.8-2.2S9.2 13 11.6 13s2.4-2.2 4.8-2.2S18.8 13 22 13" />
											<path d="M2 18c2.4 0 2.4-2.2 4.8-2.2S9.2 18 11.6 18s2.4-2.2 4.8-2.2S18.8 18 22 18" />
										</svg>
									</div>
								)}
							</div>

							<div className="details col-md-6">
								<h3 className="gw-section-title">About</h3>
								{this.renderDescription()}
							</div>
						</div>

						{/*
						  * Rendered only when it has something. The strip is correct code
						  * with almost nothing in it today - riders have logged very few
						  * session photographs - and a standing empty header would read
						  * as broken rather than as new.
						  */}
						{features.spot_community_photos && this.props.photos.length > 0 && (
							<div className="row">
								<div className="col-12">
									<h3 className="gw-section-title">From sessions here</h3>
									<div className="gw-photo-strip">
										{this.props.photos.map((photo) => (
											<a
												className="gw-photo"
												key={photo.id}
												href={`/session/${photo.session.id}`}
												title={photo.session.title || ""}
											>
												<img src={photo.url} alt="" loading="lazy" />
											</a>
										))}
									</div>
								</div>
							</div>
						)}

						{features.spot_notes && (
							<div className="row">
								<div className="col-12">
									<NoteThread
										notes={this.props.notes}
										canWrite={this.canWrite()}
										viewerId={viewer.id}
										onAdd={this.onAddNote}
										onDelete={(id) => this.props.deleteNote(this.props.session, id)}
									/>
								</div>
							</div>
						)}
					</div>
				</FormCard>
				<Modal show={this.state.showMap} handleClose={this.hideMap} className="gw-map-modal">
					<div className="gw-map-body">
						<div className="gw-map-head">
							<span className="gw-eyebrow">{spot.name}</span>
							<button
								type="button"
								className="gw-lightbox-close"
								onClick={this.hideMap}
								aria-label="Close"
							>
								&times;
							</button>
						</div>
						{this.state.showMap && this.coords() && (
							/* Mounted only while open: the iframe fetches tiles the moment
							   it exists, so rendering it behind display:none would pull
							   them on every spot page whether or not anyone opens a map. */
							<iframe
								className="gw-map-frame"
								title={"Map of " + spot.name}
								src={this.embedUrl(this.coords())}
								loading="lazy"
							/>
						)}
						{spot.url && (
							<a
								className="gw-link gw-map-out"
								href={spot.url}
								target="_blank"
								rel="noopener noreferrer"
							>
								Open the full map in a new tab &rarr;
							</a>
						)}
					</div>
				</Modal>
			</MainContainer>
		);
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(SpotView);
