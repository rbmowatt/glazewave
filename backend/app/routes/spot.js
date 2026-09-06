const { Router } = require('express');
const cognitoAuth = require('./../lib/cognitoAuth');
const BaseService = require('./../services/SurflineSpotService');
const EntityType = 'Spot';

const router = new Router();

const DEFAULT_RADIUS_M = 50000;
const MAX_RADIUS_M = 200000;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;
const DEFAULT_SEARCH_LIMIT = 8;
const MAX_SEARCH_LIMIT = 25;

// One character matches most of the table and ranks it by distance, which
// reads as a broken field rather than a search.
const MIN_QUERY_LENGTH = 2;

const clamp = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

/*
 * QueryParser puts every unreserved query param into req.parser.wheres, so lat
 * and lon would reach Sequelize as a where clause if this went through
 * BaseService.where. Read them off req.query instead.
 */
router.get('/nearest', function (req, res) {
  const lat = Number.parseFloat(req.query.lat);
  const lon = Number.parseFloat(req.query.lon);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(lon) || lon < -180 || lon > 180) {
    res.status(400).send({
      message: "lat and lon are required and must be valid coordinates."
    });
    return;
  }

  BaseService.make().nearest({
    lat: lat,
    lon: lon,
    radius: clamp(req.query.radius, DEFAULT_RADIUS_M, MAX_RADIUS_M),
    limit: clamp(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT),
  })
    .then(spots => {
      res.send({ spots: spots });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving " + EntityType + "."
      });
    });
});

/*
 * Name search behind the location field. Open for the same reason /nearest is.
 *
 * lat and lon are optional and only rank the results - a search still answers
 * without them, which is what happens when the browser denies geolocation.
 *
 * QueryParser puts q, lat and lon into req.parser.wheres, so as with /nearest
 * these have to come off req.query or they reach Sequelize as a where clause.
 */
router.get('/search', function (req, res) {
  const q = String(req.query.q || '').trim();

  // An empty result, not a 400: the field calls this on every keystroke and a
  // rejected request would put an error in the console for normal typing.
  if (q.length < MIN_QUERY_LENGTH) {
    res.send({ spots: [] });
    return;
  }

  const lat = Number.parseFloat(req.query.lat);
  const lon = Number.parseFloat(req.query.lon);
  const hasOrigin =
    Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
    Number.isFinite(lon) && lon >= -180 && lon <= 180;

  BaseService.make().search({
    q: q,
    lat: hasOrigin ? lat : null,
    lon: hasOrigin ? lon : null,
    limit: clamp(req.query.limit, DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT),
  })
    .then(spots => {
      res.send({ spots: spots });
    })
    .catch(err => {
      console.error('GET /api/spot/search failed:', err);
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving " + EntityType + "."
      });
    });
});

/*
 * Auth is applied per route rather than to the whole router: /nearest has to
 * stay open, because a signed-out visitor looking at a public session should
 * still see where it was surfed.
 */
router.post('/', cognitoAuth.getVerifyMiddleware(), function (req, res) {
  BaseService.make().create({ ...req.body, created_by: req.body.created_by })
    .then(spot => {
      res.status(201).send(spot);
    })
    .catch(err => {
      if (err.code === 'SPOT_EXISTS') {
        // 409 rather than 400: the request was fine, the spot just exists. The
        // client shows the match and lets the user pick it.
        res.status(409).send({ message: err.message, spot: err.spot });
        return;
      }
      console.error('POST /api/spot failed:', err);
      res.status(400).send({ message: err.message });
    });
});

module.exports = router;
