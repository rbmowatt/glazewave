import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import OwnerBadge from "./../layout/OwnerBadge";

// Matches SpotNoteService.MAX_BODY. The server refuses anything longer with a
// 400, so the counter here is the difference between a caught typo and a lost
// paragraph.
const MAX_BODY = 4000;

/*
 * One level deep, because that is what the API enforces: a reply to a reply is
 * a 400, not a nested row. So there is no recursion here and no depth prop -
 * if this ever renders three levels, the server contract changed.
 */
const NoteBody = ({ note, viewerId, canWrite, onDelete }) => {
	const mine = Boolean(viewerId) && note.user && note.user.id === viewerId;
	return (
		<div className="gw-note-body">
			<div className="gw-note-head">
				<OwnerBadge user={note.user} />
				<span className="gw-note-when">
					{note.created_at ? new Date(note.created_at).toLocaleDateString() : ""}
				</span>
				{canWrite && mine && (
					<FontAwesomeIcon
						className="gw-note-delete"
						icon={faTrash}
						onClick={() => onDelete(note.id)}
					/>
				)}
			</div>
			<p className="gw-note-text">{note.body}</p>
		</div>
	);
};

class NoteThread extends Component {
	state = { body: "", replyTo: null, replyBody: "" };

	submit = (e) => {
		e.preventDefault();
		const body = this.state.body.trim();
		if (!body) return;
		this.props.onAdd({ body: body, parent_id: null });
		this.setState({ body: "" });
	};

	submitReply = (e, parentId) => {
		e.preventDefault();
		const body = this.state.replyBody.trim();
		if (!body) return;
		this.props.onAdd({ body: body, parent_id: parentId });
		this.setState({ replyTo: null, replyBody: "" });
	};

	render() {
		const { notes, canWrite, viewerId, onDelete } = this.props;
		return (
			<div className="gw-notes">
				<h3 className="gw-section-title">Notes</h3>

				{canWrite ? (
					<form className="gw-note-form" onSubmit={this.submit}>
						<textarea
							className="gw-note-input"
							placeholder="What should someone know before they paddle out here?"
							maxLength={MAX_BODY}
							value={this.state.body}
							onChange={(e) => this.setState({ body: e.target.value })}
						/>
						<button className="gw-btn" type="submit" disabled={!this.state.body.trim()}>
							Post
						</button>
					</form>
				) : (
					<p className="gw-note-signed-out">Sign in to leave a note.</p>
				)}

				{!notes.length && <p className="gw-empty">No notes yet.</p>}

				{notes.map((note) => (
					<div className="gw-note" key={note.id}>
						<NoteBody note={note} viewerId={viewerId} canWrite={canWrite} onDelete={onDelete} />

						{(note.replies || []).map((reply) => (
							<div className="gw-note gw-note-reply" key={reply.id}>
								<NoteBody note={reply} viewerId={viewerId} canWrite={canWrite} onDelete={onDelete} />
							</div>
						))}

						{canWrite && this.state.replyTo !== note.id && (
							<button
								className="gw-link-btn"
								onClick={() => this.setState({ replyTo: note.id, replyBody: "" })}
							>
								Reply
							</button>
						)}

						{canWrite && this.state.replyTo === note.id && (
							<form className="gw-note-form gw-note-reply" onSubmit={(e) => this.submitReply(e, note.id)}>
								<textarea
									className="gw-note-input"
									maxLength={MAX_BODY}
									value={this.state.replyBody}
									onChange={(e) => this.setState({ replyBody: e.target.value })}
								/>
								<button className="gw-btn" type="submit" disabled={!this.state.replyBody.trim()}>
									Reply
								</button>
								<button
									className="gw-link-btn"
									type="button"
									onClick={() => this.setState({ replyTo: null, replyBody: "" })}
								>
									Cancel
								</button>
							</form>
						)}
					</div>
				))}
			</div>
		);
	}
}

export default NoteThread;
