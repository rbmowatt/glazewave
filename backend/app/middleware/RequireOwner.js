'use strict';

const { isOwner } = require('./../services/rights/Visibility');

/*
 * Ownership on the write verbs. The reads were scoped by Visibility already;
 * PUT and DELETE checked that the caller was somebody, not that the row was
 * theirs, so any signed-in rider could edit or delete any session, any board
 * and any photo attached to either.
 *
 * Mount it BEFORE the multer middleware on routes that take an upload. Multer
 * streams the file into S3 while it parses the request, so a check that runs
 * after it has already paid for - and stored - the upload it then refuses.
 *
 * A row the caller may not touch answers 404, identically to one that does not
 * exist. 403 would confirm the id is real, which is how a private session gets
 * enumerated.
 */
const requireOwner = ({ find, column = 'user_id', param = 'id' }) => (req, res, next) => {
  if (!req.viewer) {
    return res.status(401).send({ message: 'Sign in first.' });
  }

  return Promise.resolve(find(req.params[param]))
    .then((row) => {
      if (!row || (!isOwner(req.viewer, row, column) && !req.viewer.isAdmin)) {
        return res.status(404).send({ message: 'Not found.' });
      }
      // Handlers that need the row again get it for free rather than reloading.
      req.ownedRow = row;
      return next();
    })
    .catch((err) => {
      console.error('ownership check failed:', err);
      res.status(500).send({ message: 'Could not verify the row.' });
    });
};

module.exports = requireOwner;
