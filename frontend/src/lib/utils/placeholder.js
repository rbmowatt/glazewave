/*
 * Stand-in art for a board with no photo yet.
 *
 * The board keeps the same one for life because the index is derived from its
 * id, not stored - so there is no column, no write path and no backfill, and
 * every board that predates this file already has one. The cost of that is the
 * ORDER OF THIS ARRAY IS DATA. Reordering it, or dropping an entry, silently
 * reassigns the art on every board past the change. Append only.
 *
 * Sequential ids walk the list, so a run of boards created together gets ten
 * different images before it repeats.
 */
const BOARD_PLACEHOLDERS = [
  "/img/placeholders/board_missing_placeholder.jpg",
  "/img/placeholders/board_missing_gone_surfing.jpg",
  "/img/placeholders/board_missing_leash.jpg",
  "/img/placeholders/board_missing_sand.jpg",
  "/img/placeholders/board_missing_bag.jpg",
  "/img/placeholders/board_missing_shadow.jpg",
  "/img/placeholders/board_missing_wanted.jpg",
  "/img/placeholders/board_missing_lunch.jpg",
  "/img/placeholders/board_missing_napkin.jpg",
  "/img/placeholders/board_missing_beach_closed.jpg",
];

/*
 * Ids arrive as a number from the API and as a string from a route param, and
 * an unsaved record has none at all. Anything that does not parse takes the
 * first entry rather than rendering a broken image from `NaN % length`.
 */
const pick = (list, recordId) => {
  const id = parseInt(recordId, 10);
  if (!Number.isFinite(id) || id < 0) return list[0];
  return list[id % list.length];
};

export const boardPlaceholder = (boardId) => pick(BOARD_PLACEHOLDERS, boardId);

/*
 * The same arrangement for a session with no photo. Six rather than ten: four
 * of the ten generated frames had a surfer whose body did not connect to itself
 * or to the board, and they were left out of the repo entirely.
 *
 * `fun` and `action` sit last deliberately. They survive a glance but not
 * scrutiny - a board with no fins and no leash, a rider standing upright in
 * ankle-deep water. Being last only buys anything for ids 0-3; past that the
 * modulo hands out all six evenly. Drop them from the array if that is not
 * good enough - nothing else has to change.
 *
 * Same rule as above: APPEND ONLY. The order is what assigns the art.
 */
const SESSION_PLACEHOLDERS = [
  "/img/placeholders/surfer_missing_lookout.jpg",
  "/img/placeholders/surfer_missing_lineup.jpg",
  "/img/placeholders/surfer_missing_post.jpg",
  "/img/placeholders/surfer_missing_cutback.jpg",
  "/img/placeholders/surfer_missing_fun.jpg",
  "/img/placeholders/surfer_missing_action.jpg",
];

export const sessionPlaceholder = (sessionId) => pick(SESSION_PLACEHOLDERS, sessionId);
