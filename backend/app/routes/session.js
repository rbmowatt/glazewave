const db = require("../models");
const Session = db.Session;
const Op = db.Sequelize.Op;
const { Router } = require('express');

const router = new Router();

router.get('/', function (req, res) {
  const title = req.query.title;
  var condition = title ? { title: { [Op.like]: `%${title}%` } } : null;

  Session.findAll({ where: condition })
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
  Session.findByPk(id, {include: 'Board'})
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

  // Create a Session
  const session = {
    title: req.body.title,
    description: req.body.description,
    published: req.body.published ? req.body.published : false
  };

  // Save Session in the database
  Session.create(session)
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
  const id = req.params.id;
  Session.update(req.body, {
    where: { id: id }
  })
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

  Session.destroy({
    where: { id: id }
  })
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