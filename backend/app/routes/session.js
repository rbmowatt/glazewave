const { Router } = require('express');
let upload = require('./../services/images/upload');
const BaseService = require('./../services/SessionService');
const ImageService  = require('./../services/ImageService');
const EntityType = 'Session';

const router = new Router();

router.get('/', function (req, res) {
  BaseService.make().where( req.query ,req.parser.with, [], [], req.parser.limit, req.parser.page)
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
  BaseService.make().find(id,req.parser.with)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving " + EntityType + " with id=" + id
      });
    });
});


router.post('/', upload.single('photo'), function (req, res) {
  // Validate request
  console.log('req.body', req.body);
  if (!req.body.title) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  BaseService.make().create(req.body)
    .then(data => {
      if(req.file && req.file.key){
        const imgObj = { user_id : req.body.user_id, session_id : data.id, name : req.file.key, is_public : 0, is_default : 1};
        ImageService.make('SessionImage').create(imgObj)
      }
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the " + EntityType + "."
      });
    });
});

router.put('/:id', upload.single('photo'),function (req, res) {
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