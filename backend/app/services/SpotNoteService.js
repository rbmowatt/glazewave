'use strict';

const db = require('./../models');
const Op = db.Sequelize.Op;

/*
 * The spot page's note thread. One level: a note, and replies to it.
 *
 * DEPTH IS ENFORCED HERE, not in the schema. MySQL cannot express "the parent
 * has no parent", and a CHECK that could would not stop a later UPDATE. The
 * table can therefore hold a shape the page cannot render, so every write goes
 * through create() and nothing else inserts into spot_notes.
 */

const MAX_BODY = 4000;

// Whole-thread cap. A spot with more notes than this needs pagination, not a
// bigger number - and nothing renders a cursor yet.
const MAX_THREAD = 200;

/*
 * Ten notes in five minutes, per rider, across all spots.
 *
 * Not a real rate limiter - it is one COUNT and it resets on a rolling window
 * a determined person can wait out. It exists because this is the first
 * endpoint on the site that writes public text, there is no moderation UI, and
 * an unbounded POST behind a valid token is how a thread fills overnight.
 */
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 10;

const fail = (code, message) => {
  const err = new Error(message);
  err.code = code;
  return err;
};

class SpotNoteService {

  static make() { return new SpotNoteService(); }

  normalize(body) {
    const text = String(body == null ? '' : body).trim();
    if (!text) throw fail('NOTE_EMPTY', 'A note cannot be empty.');
    if (text.length > MAX_BODY) {
      throw fail('NOTE_TOO_LONG', `A note is at most ${MAX_BODY} characters.`);
    }
    return text;
  }

  /*
   * The whole thread in ONE query, grouped in memory.
   *
   * The obvious shape - top-level notes, then replies per note - is an N+1 on
   * an unauthenticated route, and a spot with forty notes would be forty-one
   * round trips to anyone who asks. Hidden rows never load: the model's
   * default scope drops them, so a hidden note takes its replies with it
   * rather than orphaning them into the top level.
   */
  async thread(spotId, limit = MAX_THREAD) {
    const rows = await db.SpotNote.findAll({
      where: { spot_id: String(spotId) },
      include: [{ model: db.User, attributes: ['id', 'username', 'first_name', 'profile_img'] }],
      order: [['createdAt', 'ASC'], ['id', 'ASC']],
      limit: Math.min(limit, MAX_THREAD),
    });

    const shape = (row) => ({
      id: row.id,
      body: row.body,
      // createdAt, not created_at. underscored:true maps the COLUMN to
      // created_at and leaves the ATTRIBUTE as createdAt - Sequelize emits
      // `created_at` AS `createdAt`. Reading the snake_case name off the
      // instance yields undefined, which serializes to a missing key rather
      // than an error.
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      user: row.User
        ? { id: row.User.id, first_name: row.User.first_name, profile_img: row.User.profile_img }
        : null,
    });

    const tops = [];
    const byParent = new Map();
    rows.forEach((row) => {
      if (row.parent_id === null) {
        tops.push(row);
        return;
      }
      if (!byParent.has(row.parent_id)) byParent.set(row.parent_id, []);
      byParent.get(row.parent_id).push(row);
    });

    // Newest thread first, but replies oldest first - a conversation reads
    // down, a list of conversations reads with the live one on top.
    return tops.reverse().map((row) => Object.assign(shape(row), {
      replies: (byParent.get(row.id) || []).map(shape),
    }));
  }

  async assertUnderRate(userId) {
    const since = new Date(Date.now() - RATE_WINDOW_MS);
    const recent = await db.SpotNote.scope('moderation').count({
      where: { user_id: userId, createdAt: { [Op.gte]: since } },
    });
    if (recent >= RATE_MAX) {
      throw fail('NOTE_RATE_LIMIT', 'That is a lot of notes at once. Try again in a few minutes.');
    }
  }

  async create({ spotId, userId, body, parentId = null }) {
    const text = this.normalize(body);
    await this.assertUnderRate(userId);

    const spot = await db.SurflineSpot.findByPk(String(spotId));
    if (!spot) throw fail('SPOT_NOT_FOUND', 'Spot not found.');

    if (parentId) {
      const parent = await db.SpotNote.findByPk(parentId);
      // A reply to a hidden note is refused by the default scope above, which
      // is right: hiding a note should not leave a place to keep replying.
      if (!parent) throw fail('PARENT_NOT_FOUND', 'That note is no longer there.');
      // Both checks matter. Same spot, or a reply lands under a thread on a
      // different beach; parent_id null, or the one-level rule is decided by
      // whoever posts fastest.
      if (String(parent.spot_id) !== String(spotId)) {
        throw fail('PARENT_MISMATCH', 'That note belongs to a different spot.');
      }
      if (parent.parent_id !== null) {
        throw fail('PARENT_IS_REPLY', 'Replies go on the note, not on another reply.');
      }
    }

    return db.SpotNote.create({
      spot_id: String(spotId),
      user_id: userId,
      parent_id: parentId || null,
      body: text,
      is_hidden: false,
    });
  }

  /*
   * find for the mutation routes. Default scope, so a hidden note answers 404
   * to its own author as well - un-hiding is a moderation action and belongs
   * in the admin console, not in an edit form.
   */
  async find(id) {
    return db.SpotNote.findByPk(id);
  }

  async update(id, body) {
    const text = this.normalize(body);
    const note = await db.SpotNote.findByPk(id);
    if (!note) throw fail('NOTE_NOT_FOUND', 'Not found.');
    note.body = text;
    await note.save();
    return note;
  }

  // Soft. There is no way to get a row back on this project - no database
  // restore has ever been rehearsed - and a note is somebody's writing.
  async hide(id) {
    const note = await db.SpotNote.findByPk(id);
    if (!note) throw fail('NOTE_NOT_FOUND', 'Not found.');
    note.is_hidden = true;
    await note.save();
    return note;
  }
}

module.exports = SpotNoteService;
module.exports.MAX_BODY = MAX_BODY;
module.exports.MAX_THREAD = MAX_THREAD;
