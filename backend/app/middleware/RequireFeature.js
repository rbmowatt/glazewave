'use strict';

const AppSettings = require('./../services/AppSettings');

/*
 * Gates a route on a runtime flag.
 *
 * On the ROUTE, never on the component. A flag that only hides a section of
 * the page leaves the endpoint reachable by anyone who reads the bundle, which
 * is not a switched-off feature, it is an undocumented one.
 *
 * 404, not 403. A disabled feature should be indistinguishable from one that
 * does not exist; 403 announces there is a comment system waiting to be turned
 * on and invites someone to keep checking. The body matches what the spot
 * routes already send for a missing row, so nothing downstream can tell the
 * two apart either.
 *
 * AppSettings answers off on any failure, so a database blip closes these
 * routes rather than opening them.
 */
const requireFeature = (name) => (req, res, next) =>
  AppSettings.enabled(name)
    .then((on) => {
      if (!on) return res.status(404).send({ message: 'Not found.' });
      return next();
    })
    .catch((err) => {
      console.error(`feature check failed for ${name}:`, err.message);
      res.status(404).send({ message: 'Not found.' });
    });

module.exports = requireFeature;
