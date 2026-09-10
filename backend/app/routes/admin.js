const { Router } = require('express');
const AppSettings = require('./../services/AppSettings');

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

module.exports = router;
