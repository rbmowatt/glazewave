'use strict';

/*
 * The demo account is one shared row that anybody can sign into, so every
 * visitor is the same rider. Left writable, whatever one person types is what
 * the next person sees: a visitor renamed it to himself and uploaded a photo
 * of his own face, which then served to everyone who clicked the button.
 *
 * Cosmetics are the mild version. The same account owns three user_boards
 * whose ratings feed board_ratings, so an anonymous visitor could move the
 * community score of three real catalog models - and could push arbitrary
 * images into the uploads bucket through it.
 *
 * Refused here rather than hidden in the UI. The frontend hides the controls
 * too, but that is courtesy: the token is handed to the browser and anyone can
 * replay it with curl.
 */
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Keyed on the account, not on how the token was minted. A demo token is the
// only way in today, but the rule wanted is "this row is read-only", which
// holds however somebody arrives at it.
const DEMO_USERNAME = process.env.DEMO_USERNAME || 'demo';

const demoReadOnly = (req, res, next) => {
  if (!WRITE_METHODS.includes(req.method)) return next();
  if (!req.viewer || req.viewer.username !== DEMO_USERNAME) return next();

  return res.status(403).send({
    message: 'The demo account is read-only. Sign up for an account to log sessions and boards.',
    demo_read_only: true,
  });
};

module.exports = demoReadOnly;
