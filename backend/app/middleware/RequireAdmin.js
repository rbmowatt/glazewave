'use strict';

/*
 * Admin gate. Runs after Viewer, which is what resolves req.viewer.isAdmin
 * from the cognito:groups claim and rejects the demo signing key.
 *
 * One body shape for both refusals so the console can render a single "not an
 * admin" screen rather than inferring it from a status code.
 */
const requireAdmin = (req, res, next) => {
  if (!req.viewer) {
    return res.status(401).send({ message: 'Sign in first.', admin_required: true });
  }
  if (!req.viewer.isAdmin) {
    return res.status(403).send({ message: 'Admins only.', admin_required: true });
  }
  return next();
};

module.exports = requireAdmin;
