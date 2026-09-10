const { Router } = require('express');
const cognitoAuth = require('./../lib/cognitoAuth');
const BaseService = require('./../services/SurflineSpotService');
const SpotImageService = require('./../services/SpotImageService');
const coastline = require('./../services/Coastline');
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

// The picker chips and the search rows are thumbnails; 400 is the rung built
// for them. The detail card asks for 800. A spot whose source photo is narrower
// than either gets its own largest rung instead - SpotImageService never rounds
// up to a key that was not built.
const LIST_IMAGE_WIDTH = 400;
const DETAIL_IMAGE_WIDTH = 800;

// Everything the atlas fields are for, minus geo: that column holds the pair
// reversed by the parked Surfline import and is read by nothing.
const DETAIL_COLUMNS = [
  'id', 'name', 'url', 'lat', 'lon', 'county', 'source', 'is_public',
  'break_type', 'wave_direction', 'bottom', 'difficulty', 'hazards', 'notes',
];

/*
 * One query for the whole page, never one per row: /nearest returns up to 50
 * rows and /search up to 25, both unauthenticated, so a per-row lookup is 50
 * round trips any stranger can ask for.
 *
 * A spot with no usable image gets no `image` key at all rather than a null
 * one. 289 of the 1,611 seeded spots have no photograph and the frontend
 * fallback keys off absence.
 *
 * Image trouble degrades to a list without photos rather than a 500. /nearest
 * is what the create-session flow calls to find out where you are standing,
 * and losing that because a licence row is missing would be the worse failure.
 */
const attachImages = async (spots, width) => {
  if (!spots || !spots.length) return spots;
  try {
    const images = await SpotImageService.make()
      .defaultsFor(spots.map((spot) => spot.id), width);
    return spots.map((spot) => {
      const image = images.get(spot.id);
      return image ? { ...spot, image: image } : spot;
    });
  } catch (err) {
    console.error('spot image attach failed:', err.message);
    return spots;
  }
};

/*
 * limit is one of QueryParser's reserved keys and it deletes those off
 * req.query before any router runs, so req.query.limit is always undefined
 * here and both routes served their default no matter what the caller asked
 * for. The raw URL still carries it. lat, lon, radius and q are unreserved
 * and survive, so only limit needs this.
 */
const rawParam = (req, name) => {
  const mark = req.originalUrl.indexOf('?');
  if (mark === -1) return undefined;
  const value = new URLSearchParams(req.originalUrl.slice(mark + 1)).get(name);
  return value === null ? undefined : value;
};

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
    limit: clamp(rawParam(req, 'limit'), DEFAULT_LIMIT, MAX_LIMIT),
  })
    .then(spots => attachImages(spots, LIST_IMAGE_WIDTH))
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
 * Is this point on land that touches open ocean.
 *
 * Answered here rather than at session-save time so the picker can say why a
 * place was refused while the surfer is still looking at it, and so the
 * create-session chips cost no request at all - the verdict rides on the pin.
 *
 * known:false means there is no shoreline data within reach: a coast outside
 * the boxes in scripts/build_coastline.js, or a point far inland. Both refuse.
 */
router.get('/coastal', function (req, res) {
  const lat = Number.parseFloat(req.query.lat);
  const lon = Number.parseFloat(req.query.lon);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(lon) || lon < -180 || lon > 180) {
    res.status(400).send({
      message: "lat and lon are required and must be valid coordinates."
    });
    return;
  }

  try {
    res.send(coastline.classify(lat, lon));
  } catch (err) {
    // A missing or truncated coastline.bin must not take the route down with
    // it. Unknown reads the same as inland to every caller, which fails closed.
    console.error('coastal lookup failed:', err.message);
    res.send({ coastal: false, known: false, shoreline_m: null, open: 0 });
  }
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
    limit: clamp(rawParam(req, 'limit'), DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT),
  })
    .then(spots => attachImages(spots, LIST_IMAGE_WIDTH))
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
  // created_by came off the request body, so the rider who added a spot was
  // whoever the client said it was. req.viewer is null in the window between
  // a Cognito signup and the firstOrNew that mints the users row, which is an
  // unattributed spot rather than a rejected one.
  BaseService.make().create({ ...req.body, created_by: req.viewer ? req.viewer.id : null })
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

/*
 * A single spot, with its default photograph and the credit that photograph's
 * licence requires.
 *
 * Ids carry their provenance - osm:way/1036392284, osm:node/..., wd:Q7644300 -
 * so every one of the 1,611 seeded ids contains a slash. A plain '/:id' matches
 * one path segment and would never match a real spot; the wildcard is what
 * lets the id go in the URL literally, with no percent-encoding for the caller
 * to get wrong and no dependency on how nginx normalizes %2F.
 *
 * Declared last on purpose. Express matches in declaration order, and this
 * pattern would otherwise swallow /nearest, /coastal and /search as ids.
 */
router.get('/:id(*)', function (req, res) {
  const id = String(req.params.id || '').trim();
  if (!id) {
    res.status(404).send({ message: EntityType + " not found." });
    return;
  }

  const width = Number.parseInt(rawParam(req, 'width'), 10) || DETAIL_IMAGE_WIDTH;

  BaseService.make().find({ id: id, selects: DETAIL_COLUMNS })
    .then(async spot => {
      // is_public is NOT NULL DEFAULT true and create() sets it, so this
      // excludes nothing today. It is here so a spot somebody later hides
      // stops resolving by id without anyone having to remember this route.
      if (!spot || spot.is_public === false) {
        res.status(404).send({ message: EntityType + " not found." });
        return;
      }

      let image = null;
      try {
        const images = await SpotImageService.make().publicFor(id, width);
        image = images[0] || null;
      } catch (err) {
        console.error('spot image lookup failed:', err.message);
      }

      const body = spot.toJSON();
      if (image) body.image = image;
      res.send({ spot: body });
    })
    .catch(err => {
      console.error('GET /api/spot/:id failed:', err);
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving " + EntityType + "."
      });
    });
});

module.exports = router;
