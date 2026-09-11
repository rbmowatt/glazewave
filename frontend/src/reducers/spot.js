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
} from './../actions/types';

/*
 * One spot at a time, not a map keyed by id.
 *
 * board_ratings keys by id because a list of cards each needs its own score.
 * Nothing here is ever wanted for two spots at once - the picker chips carry
 * their own image on the row the search returned - so a map would be a cache
 * with no reader and one more place for a stale entry to surface.
 *
 * selected is null until the request lands, and the page distinguishes that
 * from "loaded, no such spot" through the api slice rather than by guessing
 * from an empty object.
 */
const initialState = { selected: null, notFound: false, photos: [], notes: [] };

const spot = (state = initialState, action) => {
  switch (action.type) {
    case SPOT_LOADED:
      return {...state, selected: action.payload, notFound: false};

    case SPOT_NOT_FOUND:
      return {...state, selected: null, notFound: true};

    case SPOT_CLEARED:
      return initialState;

    case SPOT_PHOTOS_LOADED:
      return {...state, photos: action.payload};

    case SPOT_NOTES_LOADED:
      return {...state, notes: action.payload};

    case SPOT_NOTE_CREATED: {
      const { note, user } = action.payload;
      if (!note) return state;
      const entry = {
        id: note.id,
        body: note.body,
        created_at: note.created_at,
        updated_at: note.created_at,
        user: user,
        replies: [],
      };
      // A reply goes under its parent; a note goes on top, matching the
      // server's own ordering - newest thread first, replies oldest first.
      if (note.parent_id) {
        return {...state, notes: state.notes.map((top) =>
          top.id === note.parent_id
            ? Object.assign({}, top, { replies: top.replies.concat([entry]) })
            : top
        )};
      }
      return {...state, notes: [entry].concat(state.notes)};
    }

    case SPOT_NOTE_UPDATED: {
      const note = action.payload;
      if (!note) return state;
      // The edited note is either a top-level one or somebody's reply, and the
      // response cannot say which without a parent_id it does carry - so both
      // levels are walked rather than trusting the shape.
      const swap = (row) => row.id === note.id
        ? Object.assign({}, row, { body: note.body, updated_at: note.updated_at })
        : row;
      return {...state, notes: state.notes.map((top) =>
        Object.assign({}, swap(top), { replies: (top.replies || []).map(swap) })
      )};
    }

    case SPOT_NOTE_DELETED: {
      const id = Number(action.payload);
      /*
       * The server hides rather than deletes, and hiding a note takes its
       * replies with it - the thread query drops them with their parent. This
       * has to do the same or a hidden note's replies would sit at the top
       * level until the next load, attached to nothing.
       */
      return {...state, notes: state.notes
        .filter((top) => Number(top.id) !== id)
        .map((top) => Object.assign({}, top, {
          replies: (top.replies || []).filter((reply) => Number(reply.id) !== id),
        })),
      };
    }

    case SPOT_DESCRIPTION_SAVED: {
      if (!state.selected || !action.payload) return state;
      // The current text lives on surfline_spots.notes server side, and the
      // detail payload carries it as `notes` - so the save has to land there,
      // not on a second field, or the page would show the old text on reload.
      return {...state, selected: Object.assign({}, state.selected, {
        notes: action.payload.body,
      })};
    }

    default:
      return state;
  }
};
export default spot;
