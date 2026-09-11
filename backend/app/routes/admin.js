const { Router } = require('express');
const AppSettings = require('./../services/AppSettings');
const UserService = require('./../services/UserService');
const Cognito = require('./../services/aws/cognito');
const viewer = require('./../middleware/Viewer');

/*
 * The admin API. Mounted behind cognitoAuthMiddleware and requireAdmin at the
 * router level in index.js - unlike /api/spot there is no route in here with
 * an anonymous form, so the gate belongs on the mount rather than per route.
 */
const router = new Router();

/*
 * What the console calls first. It is gated like everything else, so a 403
 * here IS the answer to "am I an admin" - the body carries admin_required so
 * the page can tell that apart from a dead session.
 */
router.get('/me', function (req, res) {
  res.send({
    id: req.viewer.id,
    username: req.viewer.username,
    is_admin: true,
  });
});

router.get('/settings', function (req, res) {
  AppSettings.all()
    .then((flags) => {
      // Shipped as an ordered array rather than the object AppSettings.all()
      // returns, so the console renders a stable list instead of whatever
      // order the keys land in.
      res.send({
        flags: AppSettings.FLAGS.map((key) => ({ key: key, enabled: Boolean(flags[key]) })),
      });
    })
    .catch((err) => {
      console.error('GET /api/admin/settings failed:', err);
      res.status(500).send({ message: 'Could not read the feature flags.' });
    });
});

/*
 * One flag per call. A bulk PUT would let a half-applied write leave two
 * features in a state nobody chose, and there are three of them.
 */
router.put('/settings/:key', function (req, res) {
  const key = req.params.key;

  if (!AppSettings.FLAGS.includes(key)) {
    return res.status(404).send({ message: `No such flag: ${key}` });
  }

  // Only a real boolean. A missing or stringy body would otherwise coerce to
  // false and read as "the toggle turned it off by itself".
  if (typeof req.body.enabled !== 'boolean') {
    return res.status(400).send({ message: 'enabled must be true or false.' });
  }

  AppSettings.set(key, req.body.enabled, req.viewer.id)
    .then((on) => {
      console.info(`flag ${key} set ${on ? 'on' : 'off'} by user ${req.viewer.id}`);
      res.send({ key: key, enabled: on });
    })
    .catch((err) => {
      console.error(`PUT /api/admin/settings/${key} failed:`, err);
      res.status(500).send({ message: 'Could not write the feature flag.' });
    });
});

/*
 * The rider list is two sources stitched together, and they disagree in both
 * directions on purpose:
 *
 * - a Cognito account with no users row is the normal state between signup and
 *   the first firstOrNew call, and Viewer treats it as anonymous. That gap is
 *   the first thing to look at when somebody reports "I signed up and nothing
 *   works", so it is shown rather than hidden.
 * - a users row with no Cognito account is a seeded rider. demo_seed.js writes
 *   the demo_peer_* rows so the composite board score has something to average
 *   before launch; they never sign in.
 *
 * They join on username: the pool sets username_attributes = ["email"], so
 * Cognito's Username is a generated UUID, and that UUID is what the token
 * carries and what firstOrNew writes into users.username.
 */
router.get('/users', function (req, res) {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  // BaseService.all passes `page` straight into offset - it is a row offset,
  // not a page number, whatever the name says.
  const offset = Number(req.query.offset) || 0;

  Promise.all([
    UserService.make().all({ limit: limit, page: offset, order_by: [['id', 'ASC']] }),
    // Never fatal. The instance role may have no cognito-idp permission yet,
    // and a rider list with no pool status beats a 500 that shows nothing.
    new Cognito().listUsers().catch((err) => {
      console.error('listUsers failed:', err.code || err.message);
      return { Users: [], unavailable: err.code || 'failed' };
    }),
  ])
    .then(([rows, pool]) => {
      const byUsername = new Map();
      (pool.Users || []).forEach((u) => {
        const atts = {};
        (u.Attributes || []).forEach((a) => { atts[a.Name] = a.Value; });
        byUsername.set(u.Username, {
          status: u.UserStatus,
          enabled: u.Enabled,
          email: atts.email || null,
          created_at: u.UserCreateDate,
        });
      });

      const users = rows.map((row) => {
        const pooled = byUsername.get(row.username) || null;
        byUsername.delete(row.username);
        return {
          id: row.id,
          username: row.username,
          email: row.email || (pooled && pooled.email) || null,
          first_name: row.first_name,
          last_name: row.last_name,
          is_active: row.is_active !== false && row.is_active !== 0,
          last_login: row.last_login,
          cognito: pooled,
        };
      });

      res.send({
        users: users,
        // What is left in the map after the join: signed up, never got a row.
        unlinked: Array.from(byUsername.entries()).map(([username, pooled]) => ({
          username: username,
          ...pooled,
        })),
        pool_unavailable: pool.unavailable || null,
        truncated: Boolean(pool.truncated),
      });
    })
    .catch((err) => {
      console.error('GET /api/admin/users failed:', err);
      res.status(500).send({ message: 'Could not read the rider list.' });
    });
});

/*
 * Local flag first, Cognito second, and the order is the point.
 *
 * users.is_active is what bites immediately - Viewer reads it on every request
 * and forget() drops the cached copy, so the account is locked out of the API
 * before this handler answers. AdminDisableUser only stops the NEXT sign-in;
 * a token already in a browser stays valid for up to an hour, which is the
 * whole incident when somebody is actively uploading.
 *
 * So if the Cognito call fails, the useful half has already happened and this
 * reports a partial success. The reverse order would show a "disabled" toast
 * over an account still writing to the database.
 */
function setActive(req, res, active) {
  const id = req.params.id;

  if (String(req.viewer.id) === String(id) && !active) {
    // is_active resolves to no viewer, so an admin who disables themselves
    // cannot reach this route to undo it.
    return res.status(400).send({ message: 'You cannot disable your own account.' });
  }

  UserService.make().find({ id: id, withs: [] })
    .then((row) => {
      if (!row) return res.status(404).send({ message: 'No such rider.' });

      return UserService.make().update(id, { is_active: active })
        .then(() => {
          viewer.forget(row.username);
          return new Cognito()[active ? 'enableUser' : 'disableUser']({ userName: row.username })
            .then(() => ({ cognito: 'ok' }))
            .catch((err) => {
              console.error(`cognito ${active ? 'enable' : 'disable'} failed for ${row.username}:`, err.code || err.message);
              return { cognito: err.code || 'failed' };
            });
        })
        .then(({ cognito }) => {
          console.info(`user ${id} set ${active ? 'active' : 'disabled'} by ${req.viewer.id}, cognito ${cognito}`);
          res.send({
            id: Number(id),
            is_active: active,
            cognito: cognito,
            message: cognito === 'ok'
              ? null
              : `Locked out of the API, but the Cognito account was not ${active ? 'enabled' : 'disabled'} (${cognito}). They cannot use the app; they can still sign in.`,
          });
        });
    })
    .catch((err) => {
      console.error(`POST /api/admin/users/${id} failed:`, err);
      res.status(500).send({ message: 'Could not change the account.' });
    });
}

router.post('/users/:id/disable', (req, res) => setActive(req, res, false));
router.post('/users/:id/enable', (req, res) => setActive(req, res, true));

module.exports = router;
