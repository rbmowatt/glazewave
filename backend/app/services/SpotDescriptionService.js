'use strict';

const db = require('./../models');

/*
 * The description a rider writes for a spot.
 *
 * TWO WRITES, ONE TRANSACTION. spot_descriptions is the append-only history
 * and surfline_spots.notes is the current text, denormalized so
 * GET /api/spot/:id needs no join - it already selects notes in
 * DETAIL_COLUMNS. Writing one without the other leaves a description that
 * disagrees with the history claiming to explain it, which is why this service
 * is the only thing allowed to touch either. Same rule board_ratings carries.
 *
 * There is no generator. Measured across all 1,620 spots: county, break_type,
 * wave_direction, difficulty and hazards are empty on every row and only
 * `bottom` is populated, on 648. The best sentence that could be built from
 * that restates the page header - and the seed knowingly includes bathing
 * beaches with no surf, so a confident generated line is wrong on some of
 * them. `bottom` renders as a fact chip instead. The 'generated' enum value
 * stays defined and unused.
 */

// TEXT holds 65,535 bytes. This is far below that on purpose: a description is
// a paragraph a rider reads before paddling out, and the note thread is where
// longer writing belongs.
const MAX_BODY = 4000;

class SpotDescriptionService {

  static make() { return new SpotDescriptionService(); }

  /*
   * Rejects rather than clearing on an empty body. Blanking a description is a
   * moderation action, not an edit, and it should not be reachable by
   * submitting an empty form.
   */
  normalize(body) {
    const text = String(body == null ? '' : body).trim();
    if (!text) {
      const err = new Error('A description cannot be empty.');
      err.code = 'DESCRIPTION_EMPTY';
      throw err;
    }
    if (text.length > MAX_BODY) {
      const err = new Error(`A description is at most ${MAX_BODY} characters.`);
      err.code = 'DESCRIPTION_TOO_LONG';
      throw err;
    }
    return text;
  }

  async write({ spotId, body, source = 'user', userId = null }) {
    const text = this.normalize(body);

    return db.sequelize.transaction(async (t) => {
      // Inside the transaction, not before it: a spot deleted between the
      // check and the insert would otherwise fail on the foreign key with a
      // driver error rather than a 404.
      const spot = await db.SurflineSpot.findByPk(spotId, { transaction: t });
      if (!spot) {
        const err = new Error('Spot not found.');
        err.code = 'SPOT_NOT_FOUND';
        throw err;
      }

      const revision = await db.SpotDescription.create({
        spot_id: spotId,
        body: text,
        source: source,
        user_id: userId,
      }, { transaction: t });

      await db.SurflineSpot.update(
        { notes: text },
        { where: { id: spotId }, transaction: t }
      );

      return revision;
    });
  }

  /*
   * Newest first, so [0] is what surfline_spots.notes should currently hold
   * and [1] is what a revert goes back to. Nothing renders this yet - it is
   * what the admin panel reads when a description needs undoing.
   */
  async history(spotId, limit = 20) {
    return db.SpotDescription.findAll({
      where: { spot_id: spotId },
      include: [{ model: db.User, attributes: ['id', 'username', 'first_name'] }],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit: limit,
    });
  }
}

module.exports = SpotDescriptionService;
module.exports.MAX_BODY = MAX_BODY;
