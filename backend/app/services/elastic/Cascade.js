'use strict';

const db = require('./../sequelize');
const { QueryTypes } = require('sequelize');
const { getSessionQueue, getUserBoardQueue } = require('./../queue/BetterQueue');

/*
 * Elasticsearch is not a cache of MySQL here - it holds a join.
 *
 * projections.js flattens locations.name, user_boards.name, boards.model,
 * boards' dimensions and manufacturers.name into the session document, and the
 * catalog columns into the user_board document. The model hooks only fire on
 * the row that was saved, so renaming a spot or a shaper moved MySQL and left
 * every document quoting the old value - with nothing in the log and no error
 * anywhere, because a search still answers. It just answers wrong, and stays
 * wrong until somebody happens to re-save each session by hand.
 *
 * This walks the same joins backwards and queues the rows whose documents the
 * change invalidated. Fan-out is bounded by rider data rather than catalog
 * size: every path reaches sessions through user_boards, so importing ten
 * thousand boards queues only the handful anybody owns.
 */

const ids = (rows) => [...new Set(rows.map((row) => row.id))];

const select = (sql, replacements) =>
  db.query(sql, { type: QueryTypes.SELECT, replacements });

const queueSessions = (sessionIds) => {
  for (const id of sessionIds) getSessionQueue().push({ id });
  return sessionIds.length;
};

const queueUserBoards = (userBoardIds) => {
  for (const id of userBoardIds) getUserBoardQueue().push({ id });
  return userBoardIds.length;
};

// sessions.board_id points at user_boards.id, not boards.id.
const sessionsForUserBoards = async (userBoardIds) =>
  userBoardIds.length
    ? ids(await select('SELECT id FROM sessions WHERE board_id IN (:userBoardIds)', { userBoardIds }))
    : [];

const userBoardsForBoards = async (boardIds) =>
  boardIds.length
    ? ids(await select('SELECT id FROM user_boards WHERE board_id IN (:boardIds)', { boardIds }))
    : [];

const sessionsForLocation = async (locationId) =>
  ids(await select('SELECT id FROM sessions WHERE location_id = :locationId', { locationId }));

/**
 * A spot was renamed or moved. locations.name is the session document's
 * `location`, which the dashboard's distinct-spot count aggregates on, and
 * lat/lng are its location_point.
 */
async function locationChanged(locationId) {
  return { sessions: queueSessions(await sessionsForLocation(locationId)) };
}

/**
 * A rider renamed a board or pointed it at a different catalog model. The board
 * row reindexes itself through its own hook; this is for the sessions that
 * carry its name and dimensions.
 */
async function userBoardChanged(userBoardId) {
  const sessionIds = await sessionsForUserBoards([userBoardId]);
  return { sessions: queueSessions(sessionIds) };
}

/**
 * A catalog model changed - model name, category, or any of the four
 * dimensions. Both documents carry those, so both have to move.
 */
async function boardChanged(boardIds) {
  const list = Array.isArray(boardIds) ? boardIds : [boardIds];
  const userBoardIds = await userBoardsForBoards(list);
  const sessionIds = await sessionsForUserBoards(userBoardIds);
  return {
    user_boards: queueUserBoards(userBoardIds),
    sessions: queueSessions(sessionIds),
  };
}

/**
 * A maker was renamed. manufacturers.name is denormalized two levels down, into
 * every session ridden on any board of any model that maker built.
 */
async function manufacturerChanged(manufacturerId) {
  const boardIds = ids(
    await select('SELECT id FROM boards WHERE manufacturer_id = :manufacturerId', { manufacturerId })
  );
  return boardChanged(boardIds);
}

/*
 * Hook bodies swallow their own failures on purpose. A reindex that cannot be
 * queued must not roll back or fail the write that triggered it - the row in
 * MySQL is correct either way, and backfill_elastic.js is the repair. Losing
 * the write to save the index would be the wrong trade.
 */
const guard = (label, fn) => async (...args) => {
  try {
    const counted = await fn(...args);
    const moved = Object.entries(counted).filter(([, n]) => n > 0);
    if (moved.length) {
      console.log(`reindex after ${label}: ${moved.map(([k, n]) => `${n} ${k}`).join(', ')}`);
    }
    return counted;
  } catch (err) {
    console.error(`reindex after ${label} failed: ${err.message}`);
    return null;
  }
};

/*
 * Which columns a save actually touched. save() sets options.fields to the
 * changed keys and runs afterUpdate before it resets changed(), so both are
 * readable here - options.fields first, because it is also what
 * Model.update({individualHooks: true}) passes.
 */
const changedAny = (options, instance, fields) => {
  const changed = (options && options.fields) || (instance && instance.changed()) || [];
  return fields.some((field) => changed.includes(field));
};

module.exports = {
  changedAny,
  locationChanged: guard('location change', locationChanged),
  userBoardChanged: guard('user_board change', userBoardChanged),
  boardChanged: guard('board change', boardChanged),
  manufacturerChanged: guard('manufacturer change', manufacturerChanged),
  // import_boards and the destroy hooks drive these walks directly. A destroy
  // has to read them BEFORE the row goes, because both foreign keys are
  // ON DELETE SET NULL.
  userBoardsForBoards,
  sessionsForUserBoards,
  sessionsForLocation,
  queueSessions,
  queueUserBoards,
};
