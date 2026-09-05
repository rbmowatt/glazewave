import moment from "moment";

// Zero-padded, 24h. moment's `H` and `m` drop the pad, which renders 14:05 as
// "14:5" - the reason the format string lives here rather than at each call site.
export const TITLE_STAMP_FORMAT = "MM/DD/YY HH:mm";

/*
 * Spot first, so an index sorted by title groups by beach.
 *
 * The stamp is the viewer's local wall clock, not UTC. session_date is stored
 * UTC and floored to a UTC hour to pick conditions, but this string is only a
 * label: a 6:30am paddle out in Baja has to read 06:30, not the 13:30 the
 * stored value would format to.
 */
export const defaultSessionTitle = (spotName, date) => {
  const stamp = moment(date).format(TITLE_STAMP_FORMAT);
  const spot = (spotName || "").trim();
  return spot ? `${spot} ${stamp}` : stamp;
};
