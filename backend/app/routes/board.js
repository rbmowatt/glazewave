const db = require("../models");
const Board = db.Board;
const Op = db.Sequelize.Op;
const { Router } = require('express');

const router = new Router();

router.get('/', function (req, res) {
  const title = req.query.title;
  var condition = title ? { title: { [Op.like]: `%${title}%` } } : null;

  Board.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving boards."
      });
    });
});


router.get('/:id', function (req, res) {
  const id = req.params.id;

  Board.findByPk(id)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Board with id=" + id
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

  // Create a Board
  const board = {
    title: req.body.title,
    description: req.body.description,
    published: req.body.published ? req.body.published : false
  };

  // Save Board in the database
  Board.create(board)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Board."
      });
    });
});

router.put('/:id', function (req, res) {
  const id = req.params.id;
  Board.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Board was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update Board with id=${id}. Maybe Board was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Board with id=" + id
      });
    });
});

router.delete('/:id', function (req, res) {
  const id = req.params.id;

  Board.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Board was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Board with id=${id}. Maybe Board was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Board with id=" + id
      });
    });
}); 

module.exports = router;