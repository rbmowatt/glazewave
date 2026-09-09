const { Router } = require('express');
const BaseService = require('./../services/ImageService');
const EntityType = 'Location';

const router = new Router();

/*
 * user_id came off the query string, so ?user_id=3 returned rider 3's private
 * photos to anybody. It comes off the verified token now and the query param
 * is ignored; is_public still chooses between "mine" and "mine plus public",
 * which narrows and cannot widen.
 *
 * Nothing in the frontend calls this route. It is fixed rather than deleted
 * because it is mounted and reachable either way.
 */
router.get('/', function (req, res) {
  if (!req.viewer) {
    return res.status(401).send({ message: 'Sign in to list images.' });
  }
  BaseService.make().getAll({
    wheres: { user_id: req.viewer.id, is_public: req.parser.wheres.is_public }
  })
    .then(data => {
      res.send(data[0]);
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
  BaseService.make().find(req.parser)
    .then(data => {
      res.send(data[0]);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving " + EntityType + " with id=" + id
      });
    });
});


router.post('/', function (req, res) {
  // Validate request
  if (!req.body.title) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  BaseService.make().create(req.body)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
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
      res.status(500).send({
        message: "Error updating " + EntityType + " with id=" + req.params.id
      });
    });
});

router.delete('/:id', function (req, res) {
  const id = req.params.id;

  BaseService.make().delete(id)
    .then(num => {
      if (num == 1) {
        res.send({
          message: EntityType + "  was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete ${EntityType} with id=${id}. Maybe ${EntityType} was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete " + EntityType + "  with id=" + id
      });
    });
}); 

module.exports = router;