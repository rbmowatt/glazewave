const { Router } = require('express');
const BaseService = require('./../services/UserService');
const UserBoardService = require('./../services/UserBoardService');
const EntityType = 'User';
let upload = require('./../services/images/upload');


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

router.get('/:id/average', function (req, res) {
  req.parser.id = req.params.id;
  BaseService.make().getUserAverages(req.parser)
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


router.get('/firstOrNew', function (req, res) {
  BaseService.make().where({ wheres : {username : req.query.username}})
    .then(data => {
      if(data && data.length){
        res.send(data[0]);
      }else{
        BaseService.make().create(req.parser.wheres)
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(500).send({
            message:
              err.message || "Some error occurred while creating the " + EntityType + "."
          });
        });
      }
      
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving " + EntityType + "."
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

router.post('/board', upload({destinationPath : 'board'}).single('photo'), function (req, res) {
  UserBoardService.make().create(req.body)
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

router.post('/images', upload({destinationPath : 'user', width : 400, height : 400}).single('photo'), function (req, res) {
  // Without a file the old version fell off the end of the handler and never
  // answered, so the browser sat on an open request until it timed out.
  if (!req.file) {
    return res.status(400).send({ message: "No photo was uploaded." });
  }
  BaseService.make().update(req.body.user_id,  {profile_img : req.file.key })
    .then(data => {
      if (!data) {
        return res.status(404).send({
          message: `Cannot update ${EntityType} with id=${req.body.user_id}.`
        });
      }
      // The reducer reads payload.data, so this shape is load bearing.
      res.send({
        data : req.file.key,
        message: "User image was updated successfully."
      });
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating " + EntityType + " with id=" + req.body.user_id
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