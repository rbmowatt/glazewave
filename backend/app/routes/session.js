const { Router } = require('express');
const SessionService = require('./../services/SessionService');

const router = new Router();

router.get('/', function (req, res) {
  console.log('with', req.parser.with);
  SessionService.make().where([],req.parser.with, [], [], req.parser.limit, req.parser.page)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving sessions."
      });
    });
});


router.get('/:id', function (req, res) {
  const id = req.params.id;
  SessionService.make().find(id,req.parser.with)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Session with id=" + id
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
  SessionService.make().create(req.body)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Session."
      });
    });
});

router.put('/:id', function (req, res) {
  SessionService.make().update(req.params.id, req.body)
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Session was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update Session with id=${id}. Maybe Session was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Session with id=" + id
      });
    });
});

router.delete('/:id', function (req, res) {
  const id = req.params.id;

  SessionService.make().delete(id)
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Session was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Session with id=${id}. Maybe Session was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Session with id=" + id
      });
    });
}); 

module.exports = router;