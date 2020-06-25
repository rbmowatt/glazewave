const { Router } = require('express');
const getReport = require('./../services/stormcast');
const EntityType = 'Board';

const router = new Router();

router.get('/', function (req, res) {
  getReport(req.parser.wheres)
    .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving " + EntityType + "."
        });
      });
});

module.exports = router;