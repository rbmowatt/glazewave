const { Router } = require('express');
const requireFeature = require('./../middleware/RequireFeature');
const requireOwner = require('./../middleware/RequireOwner');
const SpotNoteService = require('./../services/SpotNoteService');

const router = new Router();

/*
 * Editing and hiding one note, by its own id.
 *
 * A flat router rather than another segment under /api/spot/:id(*). The spot
 * router's wildcard is greedy and backtracks, so a second suffix under it
 * resolves - but /api/spot/<id>/notes/<n> and /api/spot/<id>/photos both
 * matching by backtracking is a parsing rule nobody should have to hold in
 * their head to read a route table. A note id is enough to find a note.
 *
 * Behind the same flag as the thread: with spot_notes off there is nothing to
 * edit, and an edit endpoint that outlives its feature is how a switched-off
 * surface stays writable.
 */

const ERRORS = {
  NOTE_EMPTY: 400,
  NOTE_TOO_LONG: 400,
  NOTE_NOT_FOUND: 404,
};

const fail = (res, err, where) => {
  const status = ERRORS[err.code];
  if (status) {
    res.status(status).send({ message: err.message });
    return;
  }
  console.error(`${where} failed:`, err);
  res.status(500).send({ message: 'Something went wrong.' });
};

/*
 * requireOwner answers 404 for a note that is not the caller's, identically to
 * one that does not exist - 403 would confirm the id is real. An admin passes,
 * which is what the moderation screen will call.
 */
const owned = requireOwner({ find: (id) => SpotNoteService.make().find(id) });

router.put('/:id', requireFeature('spot_notes'), owned, function (req, res) {
  SpotNoteService.make().update(req.params.id, req.body.body)
    .then(note => {
      res.send({ note: {
        id: note.id,
        body: note.body,
        parent_id: note.parent_id,
        created_at: note.createdAt,
        updated_at: note.updatedAt,
      } });
    })
    .catch(err => fail(res, err, 'PUT /api/spot-note/:id'));
});

/*
 * Hides rather than deletes, so this answers with the note it hid instead of a
 * count. There is no database restore rehearsed on this project and a note is
 * somebody's writing; an admin panel can bring it back, a DELETE cannot.
 */
router.delete('/:id', requireFeature('spot_notes'), owned, function (req, res) {
  SpotNoteService.make().hide(req.params.id)
    .then(note => {
      res.send({ note: { id: note.id, is_hidden: true } });
    })
    .catch(err => fail(res, err, 'DELETE /api/spot-note/:id'));
});

module.exports = router;
