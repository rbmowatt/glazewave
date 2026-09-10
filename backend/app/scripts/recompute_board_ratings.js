// Rebuilds every catalog model's community score from user_boards.
//
// The UserBoard hooks keep a rated model's own average exact as ratings come
// in, but the shrinkage prior is the mean of all model means, so every other
// model's ranking_score drifts a little whenever anybody rates anything.
// This is what corrects that, and what repairs any row a hook failed to write
// (they swallow their own errors on purpose - a score must never roll back
// the rating that triggered it).
//
// Nightly, from a systemd timer. AL2023 has no crond.
//
// Usage: node app/scripts/recompute_board_ratings.js

require('dotenv').config();
const db = require('./../services/sequelize');
const boardRating = require('./../services/rating/BoardRating');

async function main() {
  const started = Date.now();
  const { written, cleared } = await boardRating.recomputeAll();
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`board ratings: ${written} rows affected, ${cleared} cleared, ${seconds}s`);
  console.log(`shown at ${boardRating.MIN_RIDERS}+ riders, shrunk toward the catalog mean at ${boardRating.SMOOTHING_RIDERS}`);
}

main()
  .then(() => db.close())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`board rating recompute failed: ${err.message}`);
    process.exit(1);
  });
