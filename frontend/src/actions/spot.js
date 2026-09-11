import {
  SPOT_LOADED,
  SPOT_CLEARED,
  SPOT_PHOTOS_LOADED,
  SPOT_NOTES_LOADED,
  SPOT_NOTE_CREATED,
  SPOT_NOTE_UPDATED,
  SPOT_NOTE_DELETED,
  SPOT_DESCRIPTION_SAVED,
  SPOT_NOT_FOUND,
} from "./types";
import SpotRequests from './../requests/SpotRequests';
import SpotNoteRequests from './../requests/SpotNoteRequests';

export const SpotLoaded = data => ({
  type: SPOT_LOADED,
  payload: (data && data.spot) || null,
});

// Dispatched on mount, before the requests go out. Without it a second spot
// renders the first one's notes and photographs for as long as its own take to
// arrive, which reads as the wrong data rather than as loading.
export const SpotCleared = () => ({ type: SPOT_CLEARED });

/*
 * A spot that does not resolve. Needed because `selected: null` is also the
 * state while the request is in flight, and the api slice counts requests
 * without recording which one failed - so without this the page cannot tell a
 * slow load from a dead link, and both would render as a blank card.
 *
 * Reachable in normal use: 12 of the 147 public sessions are logged against a
 * locations row that was never added to surfline_spots, so a link off one of
 * those cards lands here.
 */
export const SpotNotFound = () => ({ type: SPOT_NOT_FOUND });

export const SpotPhotosLoaded = data => ({
  type: SPOT_PHOTOS_LOADED,
  payload: (data && data.photos) || [],
});

export const SpotNotesLoaded = data => ({
  type: SPOT_NOTES_LOADED,
  payload: (data && data.notes) || [],
});

/*
 * The POST answers with the row it wrote and nothing else - no User, because
 * the handler has the token, not the profile. The author rides along from the
 * component so the note renders with a name instead of blank, rather than
 * costing a second round trip to fetch the whole thread again.
 */
export const SpotNoteCreated = (data, user) => ({
  type: SPOT_NOTE_CREATED,
  payload: { note: (data && data.note) || null, user: user || null },
});

export const SpotNoteUpdated = data => ({
  type: SPOT_NOTE_UPDATED,
  payload: (data && data.note) || null,
});

export const SpotNoteDeleted = id => ({
  type: SPOT_NOTE_DELETED,
  payload: id,
});

export const SpotDescriptionSaved = data => ({
  type: SPOT_DESCRIPTION_SAVED,
  payload: (data && data.description) || null,
});

export const loadSpot = (session, id, width = null) => {
  return function (dispatch) {
    dispatch(
      new SpotRequests(session).find({
        id: id,
        // The detail route defaults to 800, which is the card width. A page
        // with a hero wants the top rung, and a narrow source still comes back
        // at its own largest - the service never rounds up.
        width: width,
        onSuccess: (data) => SpotLoaded(data),
        onFailure: () => SpotNotFound(),
      })
    );
  };
};

/*
 * Both answer 404 while their flag is off, and the middleware turns that into
 * an apiError plus onFailure. The failure action empties the slice rather than
 * leaving whatever was there, so a feature switched off mid-session stops
 * rendering instead of freezing on its last payload.
 */
export const loadSpotPhotos = (session, id) => {
  return function (dispatch) {
    dispatch(
      new SpotRequests(session).photos({
        id: id,
        onSuccess: (data) => SpotPhotosLoaded(data),
        onFailure: () => SpotPhotosLoaded(null),
      })
    );
  };
};

export const loadSpotNotes = (session, id) => {
  return function (dispatch) {
    dispatch(
      new SpotRequests(session).notes({
        id: id,
        onSuccess: (data) => SpotNotesLoaded(data),
        onFailure: () => SpotNotesLoaded(null),
      })
    );
  };
};

export const addSpotNote = (session, id, params) => {
  return function (dispatch) {
    dispatch(
      new SpotRequests(session).addNote({
        id: id,
        data: { body: params.body, parent_id: params.parent_id || null },
        onSuccess: (data) => SpotNoteCreated(data, params.user),
      })
    );
  };
};

export const updateSpotNote = (session, id, body) => {
  return function (dispatch) {
    dispatch(
      new SpotNoteRequests(session).update({
        id: id,
        data: { body: body },
        onSuccess: (data) => SpotNoteUpdated(data),
      })
    );
  };
};

export const deleteSpotNote = (session, id) => {
  return function (dispatch) {
    dispatch(
      new SpotNoteRequests(session).delete({
        id: id,
        onSuccess: () => SpotNoteDeleted(id),
      })
    );
  };
};

export const saveSpotDescription = (session, id, body) => {
  return function (dispatch) {
    dispatch(
      new SpotRequests(session).saveDescription({
        id: id,
        data: { body: body },
        onSuccess: (data) => SpotDescriptionSaved(data),
      })
    );
  };
};

export const clearSpot = () => {
  return function (dispatch) {
    dispatch(SpotCleared());
  };
};
