const { Router } = require('express');
const BaseService = require('./../services/ImageService');
const EntityType = 'Location';

const router = new Router();

router.get('/', function (req, res) {
  BaseService.make().getAll(req.parser)
    .then(data => {
        console.log(data[0])
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
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Session was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update ${EntityType} with id=${id}. Maybe ${EntityType} was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating " + EntityType + "  with id=" + id
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