import { BOARD_RATINGS_LOADED, TOP_RATED_BOARDS_LOADED } from "./types";
import BoardRatingRequests from './../requests/BoardRatingRequests';

// The reducer keys everything by board_id, so the single-board endpoint's
// object is wrapped here rather than special-cased there.
export const BoardRatingsLoaded = data => ({
  type: BOARD_RATINGS_LOADED,
  payload: Array.isArray(data) ? data : [data],
});

export const TopRatedBoardsLoaded = data => ({
  type: TOP_RATED_BOARDS_LOADED,
  payload: Array.isArray(data) ? data : [],
});

export const loadBoardRating = (session, id) => {
  return function (dispatch) {
    dispatch(
      new BoardRatingRequests(session).forBoard({
        id: id,
        onSuccess: (data) => BoardRatingsLoaded(data),
      })
    );
  };
};

export const loadBoardRatings = (session, ids) => {
  return function (dispatch) {
    if (!ids || !ids.length) return;
    dispatch(
      new BoardRatingRequests(session).forBoards({
        ids: ids,
        onSuccess: (data) => BoardRatingsLoaded(data),
      })
    );
  };
};

export const loadTopRatedBoards = (session, limit) => {
  return function (dispatch) {
    dispatch(
      new BoardRatingRequests(session).topRated({
        limit: limit,
        onSuccess: (data) => TopRatedBoardsLoaded(data),
      })
    );
  };
};
