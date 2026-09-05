const { Router } = require('express');
const BaseService = require('./../services/BoardService');
const BoardImageService = require('./../services/BoardImageService');
const EntityType = 'Board';
const multer  = require('multer');
let upload = multer();

const router = new Router();

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


// Catalog images, already resolved to { url, credit, credit_url }. This is the
// only path that returns a usable image URL: the BoardImage default scope hides
// the URL columns from ?with[]=BoardImage, so a generic include cannot produce
// something renderable and therefore cannot produce something uncredited.
router.get('/:id/images', function (req, res) {
  BoardImageService.make().publicFor(req.params.id)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.error(`GET /api/board/${req.params.id}/images failed:`, err);
      res.status(500).send({
        message: "Error retrieving images for " + EntityType + " with id=" + req.params.id
      });
    });
});

router.get('/:id', function (req, res) {
  req.parser.id = req.params.id;
  BaseService.make().find(req.parser)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving " + EntityType + " with id=" + req.query.id
      });
    });
});


router.post('/', upload.fields([]), function (req, res) {
  // Validate request
  if (!req.body.model) {
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