import { BOARD_RATINGS_LOADED, TOP_RATED_BOARDS_LOADED } from './../actions/types';

/*
 * Keyed by catalog board id, not by user_board id. A rider's board and the
 * model it points at are different things here, and mixing the two keys is how
 * two riders of one model would each see their own score as the community's.
 *
 * The map is merged rather than replaced: the list asks for a page at a time
 * and the detail page asks for one, so a replace would drop whatever the last
 * screen had already loaded.
 */
const initialState = { byBoard: {}, top: [] };

const board_ratings = (state = initialState, action) => {
  switch (action.type) {
    case BOARD_RATINGS_LOADED: {
      const byBoard = {...state.byBoard};
      action.payload.forEach((rating) => {
        if (rating && rating.board_id) byBoard[rating.board_id] = rating;
      });
      return {...state, byBoard: byBoard};
    }
    case TOP_RATED_BOARDS_LOADED: {
      // The leaderboard rows carry the same shape, so they seed the map too
      // and a click through to a board renders without a second request.
      const byBoard = {...state.byBoard};
      action.payload.forEach((rating) => {
        if (rating && rating.board_id) byBoard[rating.board_id] = rating;
      });
      return {...state, top: action.payload, byBoard: byBoard};
    }
    default:
      return state;
  }
};
export default board_ratings;
