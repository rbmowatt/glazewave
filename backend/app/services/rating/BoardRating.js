'use strict';

const db = require('./../sequelize');
const { QueryTypes } = require('sequelize');

/*
 * The community score for a catalog model: what every rider who owns one
 * thinks of it, as opposed to what any single rider's own board is rated.
 *
 * This module requires the sequelize instance rather than ../models, the same
 * way Cascade does, and for the same reason: the UserBoard hooks call it, so
 * requiring the model registry here would close a cycle and leave the models
 * undefined at load.
 */

// How many distinct riders a model needs before its score is fit to show.
// This is a disclosure control, not presentation: user_boards.is_public
// scopes reads row by row, and a score computed from one rider republishes
// that rider's private rating under a different name.
const MIN_RIDERS = 3;

// Shrinkage weight, expressed in riders. At rating_count = SMOOTHING_RIDERS
// the score sits halfway between the model's own mean and the catalog mean,
// so one rider's 10 cannot outrank a model forty riders put at 8.5.
const SMOOTHING_RIDERS = 5;

/*
 * demo_seed.js creates riders under this prefix so the feature has something
 * to show while the demo account is the only real account. They are counted
 * like anybody else - the point is to exercise the real aggregate - and
 * seeded_riders is what lets the page admit they are there.
 *
 * The flag clears itself: remove the seeded riders, recompute, and the count
 * goes to zero. Nothing has to remember to switch it off.
 */
const SEED_USERNAME_PREFIX = 'demo_peer_';

// LIKE reads _ as a single-character wildcard, so the prefix has to be
// escaped or 'demoXpeerX...' matches too.
const SEED_LIKE = SEED_USERNAME_PREFIX.replace(/[_%]/g, '\\$&') + '%';

/*
 * One vote per rider per model.
 *
 * The GROUP BY collapses a rider who owns three of the same model into one
 * number, and the caller averages riders rather than rows. Averaging the raw
 * rows instead lets one person with a quiver of the same board carry the
 * model's score alone.
 *
 * rating is NULL on a board nobody has rated and the UI reads 0 the same way
 * (BoardCard does `Number(board.rating) || 0`), so both are excluded.
 *
 * canonical_key IS NULL marks a row a person typed rather than a harvested
 * catalog model - the created_by rule on the Board model. Those are private
 * one-offs, and a "community" score over one is that one person.
 */
const riderMeans = (scoped) => `
  SELECT user_boards.board_id AS board_id,
         AVG(user_boards.rating) AS rider_rating,
         MAX(users.username LIKE :seedLike) AS seeded
    FROM user_boards
    JOIN boards ON boards.id = user_boards.board_id
    JOIN users ON users.id = user_boards.user_id
   WHERE user_boards.rating IS NOT NULL
     AND user_boards.rating > 0
     AND boards.canonical_key IS NOT NULL
     ${scoped ? 'AND user_boards.board_id IN (:boardIds)' : ''}
   GROUP BY user_boards.board_id, user_boards.user_id`;

const modelMeans = (scoped) => `
  SELECT board_id,
         AVG(rider_rating) AS rating_avg,
         COUNT(*) AS rating_count,
         SUM(seeded) AS seeded_riders
    FROM (${riderMeans(scoped)}) AS riders
   GROUP BY board_id`;

/*
 * The prior is the mean of the model means, never the mean of every rating.
 * A catalog where one popular board carries half the ratings would otherwise
 * pull every thin model toward that board's score instead of toward the
 * middle of the catalog.
 *
 * Always computed over the whole catalog, even when the recompute is scoped
 * to one model: it is a property of the catalog, not of the model being
 * written. That also means every other model's ranking_score drifts slightly
 * whenever anyone rates anything, which is what the nightly full sweep is
 * for - the incremental path keeps a model's own average exact and lets the
 * shared prior go a few hours stale.
 */
async function catalogMean() {
  const rows = await db.query(
    `SELECT AVG(rating_avg) AS catalog_mean FROM (${modelMeans(false)}) AS models`,
    { type: QueryTypes.SELECT, replacements: { seedLike: SEED_LIKE } }
  );
  const value = rows.length ? rows[0].catalog_mean : null;
  return value === null || value === undefined ? null : Number(value);
}

const upsertSql = (scoped) => `
  INSERT INTO board_ratings
              (board_id, rating_avg, rating_count, seeded_riders, ranking_score,
               created_at, updated_at)
  SELECT board_id,
         rating_avg,
         rating_count,
         seeded_riders,
         (rating_count / (rating_count + :smoothing)) * rating_avg
           + (:smoothing / (rating_count + :smoothing)) * :catalogMean,
         NOW(),
         NOW()
    FROM (${modelMeans(scoped)}) AS models
      ON DUPLICATE KEY UPDATE
         rating_avg = VALUES(rating_avg),
         rating_count = VALUES(rating_count),
         seeded_riders = VALUES(seeded_riders),
         ranking_score = VALUES(ranking_score),
         updated_at = NOW()`;

/*
 * A model whose last rating was cleared or whose last rated board was deleted
 * still has a row here, and nothing else would ever remove it.
 *
 * NOT IN is safe against the usual NULL trap only because the join to boards
 * drops any user_board whose board_id went NULL - the subquery cannot emit
 * one. An empty subquery is the intended case, not an edge: it means every
 * rating for the scoped models is gone and every scoped row should go too.
 */
const clearSql = (scoped) => `
  DELETE FROM board_ratings
   WHERE board_id NOT IN (SELECT board_id FROM (${modelMeans(scoped)}) AS models)
     ${scoped ? 'AND board_id IN (:boardIds)' : ''}`;

/*
 * Sequelize 5 does not answer with one shape here. An INSERT resolves to
 * [insertId, affectedRows] - a number - while a DELETE resolves to
 * [results, metadata] where metadata is the driver's OkPacket. The same
 * destructure therefore yields a number in one case and an object in the
 * other, which is how "[object Object] cleared" reached a log line.
 */
const affected = (result) => {
  const meta = Array.isArray(result) ? result[1] : result;
  if (typeof meta === 'number') return meta;
  return meta && typeof meta.affectedRows === 'number' ? meta.affectedRows : 0;
};

async function run(boardIds) {
  const scoped = boardIds !== null;
  const replacements = { smoothing: SMOOTHING_RIDERS, seedLike: SEED_LIKE };
  if (scoped) replacements.boardIds = boardIds;

  const mean = await catalogMean();

  // Nothing in the catalog is rated yet, so there is no prior to shrink
  // toward and nothing to write. Still clear, or a row survives the removal
  // of the last rating in the database.
  if (mean === null) {
    const cleared = affected(await db.query(clearSql(scoped), { replacements }));
    return { written: 0, cleared: cleared };
  }

  replacements.catalogMean = mean;
  // Affected rows, not rows written: MySQL counts an ON DUPLICATE KEY UPDATE
  // that changed a row as 2 and an insert as 1, so this over-reports whenever
  // a score moved rather than appeared. It is a log line, not a total.
  const written = affected(await db.query(upsertSql(scoped), { replacements }));
  const cleared = affected(await db.query(clearSql(scoped), { replacements }));
  return { written: written, cleared: cleared };
}

/*
 * Failures are swallowed, matching the Cascade hooks: a score that could not
 * be recomputed must never roll back the rating that triggered it. The rating
 * in user_boards is the source of truth and the full sweep is the repair.
 */
async function recompute(boardIds) {
  const list = [...new Set([].concat(boardIds).filter((id) => id !== null && id !== undefined))];
  if (!list.length) return { written: 0, cleared: 0 };
  try {
    return await run(list);
  } catch (err) {
    console.error(`board rating recompute failed for ${list.join(', ')}: ${err.message}`);
    return null;
  }
}

// The nightly sweep. Rebuilds every model's row against a freshly measured
// catalog mean, which is the only thing that corrects the drift the
// incremental path leaves behind.
async function recomputeAll() {
  return run(null);
}

module.exports = {
  MIN_RIDERS,
  SMOOTHING_RIDERS,
  SEED_USERNAME_PREFIX,
  recompute,
  recomputeAll,
};
