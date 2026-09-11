'use strict';

const deletes3Image = require('./../services/images/destroy');
const { isOwner } = require('./../services/rights/Visibility');

/*
 * The parent check for upload routes that name their parent in the multipart
 * BODY rather than the URL - POST /api/session/images carries session_id,
 * POST /api/user_board/images carries user_board_id. Both took that id and a
 * user_id straight off the form, so a rider could hang a photo on anybody's
 * session and stamp it with anybody's name.
 *
 * It cannot run before multer, because the body does not exist until multer
 * has parsed it - and multer has streamed the file into S3 by then. So the
 * refusal has to take the object back out, or every rejected attempt leaves
 * paid-for bytes in a versioned bucket with no row pointing at them.
 */
const discardUploads = (req) => {
  const files = req.files || (req.file ? [req.file] : []);
  return Promise.all(
    files.filter((f) => f && f.key).map((f) => deletes3Image(f.key).catch((err) => {
      console.error('could not discard a refused upload:', f.key, err.message);
    }))
  );
};

const requireParentOwner = ({ find, field, column = 'user_id' }) => (req, res, next) => {
  const refuse = (status, message) =>
    discardUploads(req).then(() => res.status(status).send({ message: message }));

  if (!req.viewer) return refuse(401, 'Sign in first.');

  const parentId = req.body ? req.body[field] : null;
  if (!parentId) return refuse(400, `${field} is required.`);

  return Promise.resolve(find(parentId))
    .then((row) => {
      if (!row || (!isOwner(req.viewer, row, column) && !req.viewer.isAdmin)) {
        return refuse(404, 'Not found.');
      }
      return next();
    })
    .catch((err) => {
      console.error('parent ownership check failed:', err);
      return refuse(500, 'Could not verify the row.');
    });
};

module.exports = requireParentOwner;
module.exports.discardUploads = discardUploads;
