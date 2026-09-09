const { Router } = require('express');
const BaseService = require('./../services/BoardService');
const BoardImageService = require('./../services/BoardImageService');
const BoardRatingService = require('./../services/BoardRatingService');
const EntityType = 'Board';

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

// The community score for a model, which is not the rider's own rating: that
// one lives on their user_boards row and is written through
// PUT /api/user_board/:id. This router is deliberately unauthenticated, and a
// score is public by definition, so nothing here is scoped to a viewer.
router.get('/:id/rating', function (req, res) {
  BoardRatingService.make().publicFor(req.params.id)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.error(`GET /api/board/${req.params.id}/rating failed:`, err);
      res.status(500).send({
        message: "Error retrieving rating for " + EntityType + " with id=" + req.params.id
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


/*
 * The catalog is read-only over HTTP. It used to expose POST, PUT and DELETE
 * here, and this router is mounted without cognitoAuthMiddleware, so anyone who
 * could reach the API could rewrite or delete a model every rider's board
 * points at. Nothing in the frontend ever called them: BoardRequests only
 * inherits get(), and every board edit goes to PUT /api/user_board/:id, which
 * touches the rider's own row and leaves board_id pointing wherever it pointed.
 *
 * The catalog is written by the harvest and its seeders, against the database.
 * A user-submitted model, when there is one, needs its own guarded route that
 * INSERTS with created_by set and never updates an existing row -- the Board
 * model's created_by comment is the rule that route has to keep.
 */

module.exports = router;