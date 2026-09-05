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
 * Board ids arrive as a number from the API and as a string from a route param,
 * and an unsaved board has none at all. Anything that does not parse takes the
 * first entry rather than rendering a broken image from `NaN % 10`.
 */
export const boardPlaceholder = (boardId) => {
  const id = parseInt(boardId, 10);
  if (!Number.isFinite(id) || id < 0) return BOARD_PLACEHOLDERS[0];
  return BOARD_PLACEHOLDERS[id % BOARD_PLACEHOLDERS.length];
};

export default BOARD_PLACEHOLDERS;
