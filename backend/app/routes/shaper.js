const { Router } = require('express');
const BaseService = require('./../services/ShaperService');
const EntityType = 'Shaper';

const router = new Router();

/*
 * Mounted behind authWrites in app/index.js, so reads are open and the write
 * verbs carry a Cognito token. Reads stay open for the same reason the maker
 * list does: the board pages ask for them before the token has rehydrated.
 */
router.get('/', function (req, res) {
  BaseService.make().where(req.parser)
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

router.get('/:id', function (req, res) {
  const id = req.params.id;
  req.parser.id = id;
  BaseService.make().find(req.parser)
    .then(data => {
      if (!data) {
        return res.status(404).send({
          message: `Cannot find ${EntityType} with id=${id}.`
        });
      }
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving " + EntityType + " with id=" + id
      });
    });
});

router.post('/', function (req, res) {
  // name, not title. The sibling routers all guard on req.body.title, which is
  // not a column on any of their models - that rejects every valid create and
  // lets an empty one through. name is NOT NULL here, so this is the real one.
  if (!req.body.name) {
    res.status(400).send({
      message: "name is required."
    });
    return;
  }
  BaseService.make().create(req.body)
    .then(data => {
      res.status(201).send(data);
    })
    .catch(err => {
      console.error('POST /api/shaper failed:', err);
      res.status(400).send({
        message:
          err.message || "Some error occurred while creating the " + EntityType + "."
      });
    });
});

router.put('/:id', function (req, res) {
  BaseService.make().update(req.params.id, req.body)
    .then(data => {
      // update() resolves the saved instance, so there is nothing to re-fetch
      // and nothing to compare against a row count. The client merges this
      // response straight into its store, so it has to be the record.
      if (!data) {
        return res.status(404).send({
          message: `Cannot update ${EntityType} with id=${req.params.id}.`
        });
      }
      res.send(data);
    })
    .catch(err => {
      console.error('PUT /api/shaper failed:', err);
      res.status(500).send({
        message: "Error updating " + EntityType + " with id=" + req.params.id
      });
    });
});

/*
 * boards.shaper_id is ON DELETE SET NULL, so this unassigns the person from
 * every model they designed rather than removing the models.
 */
router.delete('/:id', function (req, res) {
  const id = req.params.id;

  BaseService.make().delete(id)
    .then(num => {
      if (num == 1) {
        res.send({
          message: EntityType + " was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete ${EntityType} with id=${id}. Maybe ${EntityType} was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete " + EntityType + " with id=" + id
      });
    });
});

module.exports = router;
