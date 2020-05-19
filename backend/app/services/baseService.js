const db = require("../models");
const Session = db.sessions;
const Op = db.Sequelize.Op;

class BaseService {
    // Create and Save a new Session
    create = (req, res) => {
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
  };
  
  // Retrieve all Sessions from the database.
  findAll = (req, res) => {
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
  };
  
  // Find a single Session with an id
  findOne = (req, res) => {
    const id = req.params.id;
  
    Session.findByPk(id)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message: "Error retrieving Session with id=" + id
        });
      });
  };
  
  // Update a Session by the id in the request
  update = (req, res) => {
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
  };
  
  // Delete a Session with the specified id in the request
  delete = (req, res) => {
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
  };
  
  // Delete all Sessions from the database.
  deleteAll = (req, res) => {
    Session.destroy({
      where: {},
      truncate: false
    })
      .then(nums => {
        res.send({ message: `${nums} Sessions were deleted successfully!` });
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while removing all sessions."
        });
      });
  };
  
  // find all published Session
  findAllPublished = (req, res) => {
    Session.findAll({ where: { published: true } })
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving sessions."
        });
      });
  };
}