const { Router } = require('express');
let upload = require('./../services/images/upload');
const BaseService = require('./../services/SessionService');
const ImageService  = require('./../services/ImageService');
const EntityType = 'Session';

const router = new Router();

router.get('/', function (req, res) {
  BaseService.make().where( req.parser )
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

router.get('/images', function (req, res) {
  ImageService.make('SessionImage').where( req.parser )
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

router.post('/images', upload({destinationPath : 'user_sessions'}).array('photo'), function (req, res) {
  const imgs = [];
  if(req.files && req.files.length){
    req.files.forEach(file=>{
    imgs.push(new Promise((resolve, reject) => {
      let imgObj = { user_id : req.body.user_id, session_id : req.body.session_id, name : file.key, is_public : 0, is_default : 1};
      ImageService.make('SessionImage').create(imgObj).then(
        data=> resolve(data)
      )
      .catch(error=>reject(error))
      }))
    })
    }
    Promise.all(imgs).then((values) => {
      res.send(values);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err
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


router.post('/', upload({destinationPath : 'user_sessions'}).array('photo'), function (req, res) {
  if (!req.body.title) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  BaseService.make().create(req.body)
    .then(data => {
      const conditions = JSON.parse(req.body.conditions);
      if(req.files && req.files.length){
        req.files.forEach(file=>{
          let imgObj = { user_id : req.body.user_id, session_id : data.id, name : file.key, is_public : 0, is_default : 1};
          ImageService.make('SessionImage').create(imgObj)
        })
      }
      if(conditions && conditions.wave_height){
        conditions.session_id = data.id;
        BaseService.make().addConditons(conditions).then(d=>{res.send(data)})
      }else {
        res.send(data);
      }
    })
    .catch(err => {
      console.error('POST /api/session failed:', err);
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the " + EntityType + "."
      });
    });
});

router.put('/:id', upload({destinationPath : 'user_sessions'}).single('photo'),function (req, res) {
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
      // NODE_ENV=production is set on the systemd unit, so nothing else prints
      // this. Without it the only trace of a failed save is a 500 body carrying
      // none of the cause, and journalctl shows the last query and no error.
      console.error(`PUT /api/session/${req.params.id} failed:`, err);
      res.status(500).send({
        message: "Error updating " + EntityType + " with id=" + req.params.id,
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
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

router.delete('/images/:id', function (req, res) {
  const id = req.params.id;

  ImageService.make('SessionImage').delete(id)
    .then(num => {
      if (num == 1) {
        res.send({
          id : id,
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