'use strict';

const NodeCache = require('node-cache');
const cognitoAuth = require('./../lib/cognitoAuth');
const UserService = require('./../services/UserService');

/*
 * Resolves who is asking, without ever refusing the request.
 *
 * cognitoAuthMiddleware answers 401 on a bad token, which is right for a route
 * that has no anonymous form. The session and board reads do have one - a
 * public row is meant to open from a shared link, and BoardPicker reads a
 * session before the Cognito token has rehydrated - so those routes need to
 * know the caller when there is one and carry on when there is not.
 *
 * req.viewer is that answer: {id, username} or null. Never undefined, so a
 * consumer that forgets to run this middleware fails loudly on a property of
 * undefined rather than quietly scoping to anonymous.
 *
 * req.tokenUsername is the verified Cognito username on its own. It is set even
 * when no users row exists yet, which is the state /api/user/firstOrNew is
 * called in and the one case req.viewer cannot describe.
 */

// Cognito hands us a username; every row is scoped by the MySQL users.id.
// Without this the lookup costs a DB round-trip on every read.
const userIdCache = new NodeCache({ stdTTL: 300 });

async function resolveUserId(username) {
  if (!username) return null;
  const cached = userIdCache.get(username);
  if (cached !== undefined) return cached;
  const rows = await UserService.make().where({ wheres: { username }, limit: 1 });
  if (!rows || !rows.length) return null;
  userIdCache.set(username, rows[0].id);
  return rows[0].id;
}

// An access token carries `username`, an id token `cognito:username`. Both are
// accepted by the verifier, so both have to be read here.
const usernameFrom = (claims) => claims.username || claims['cognito:username'] || null;

const viewerMiddleware = (req, res, next) => {
  const header = req.get('Authorization');

  /*
   * Logged out, middleware/api.js still sets the header to the literal
   * "Bearer undefined", so absence is not the only anonymous shape. That one
   * fails jwt.decode and lands in the AuthError branch below.
   */
  req.tokenUsername = null;

  if (!header) {
    req.viewer = null;
    if (req.parser) req.parser.viewer = null;
    return next();
  }

  cognitoAuth
    .verify(header)
    .then(async (claims) => {
      const username = usernameFrom(claims);
      req.tokenUsername = username;
      return { username: username, id: await resolveUserId(username) };
    })
    .then(({ id, username }) => {
      // A verified token with no users row is not a viewer. It happens between
      // the Cognito signup and the firstOrNew that creates the row.
      req.viewer = id === null ? null : { id: id, username: username };
      if (req.parser) req.parser.viewer = req.viewer;
      next();
    })
    .catch((err) => {
      if (err instanceof cognitoAuth.AuthError) {
        req.viewer = null;
        if (req.parser) req.parser.viewer = null;
        return next();
      }
      // JWKS is unreachable. Treating that as anonymous would hide a signed-in
      // rider's own private rows from them and look like data loss, so it fails.
      console.error('viewer resolution failed:', err.message);
      res.status(500).send({ message: 'Could not verify the caller.' });
    });
};

module.exports = viewerMiddleware;
module.exports.resolveUserId = resolveUserId;
