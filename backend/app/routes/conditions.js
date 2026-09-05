const { Router } = require('express');
const resolve = require('./../services/conditions');

const router = new Router();

/*
 * QueryParser puts every unreserved query param into req.parser.wheres, so lat
 * and lon would reach Sequelize as a where clause if this read from there.
 */
router.get('/', function (req, res) {
  const lat = Number.parseFloat(req.query.lat);
  const lon = Number.parseFloat(req.query.lon);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(lon) || lon < -180 || lon > 180) {
    res.status(400).send({
      message: "lat and lon are required and must be valid coordinates."
    });
    return;
  }

  // Optional. Absent means the current hour, which is the same code path.
  resolve({ lat: lat, lon: lon, at: req.query.at })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      // NODE_ENV=production is set on the systemd unit, so finalhandler
      // replaces the message with the bare status phrase and journalctl is the
      // only place the cause appears.
      console.error('GET /api/sc failed:', err);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving conditions."
      });
    });
});

module.exports = router;
