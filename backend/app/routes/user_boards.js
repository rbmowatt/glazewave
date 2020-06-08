const { Router } = require('express');
let upload = require('./../services/images/upload');
const BaseService = require('./../services/UserBoardService');
const ImageService  = require('./../services/ImageService');
const EntityType = 'Session';

const router = new Router();

router.get('/', function (req, res) {
  BaseService.make().where( req.parser)
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
  ImageService.make("UserBoardImage").where( req.parser )
    .then(data => {
      console.log('images', data)
      res.send(data);
    })
    .catch(err => {
      console.log('ierror', err)
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
        message: "Error retrieving " + EntityType + " with id=" + req.query.id
      });
    });
});


router.post('/images', upload("boards").array('photo'), function (req, res) {
  const imgs = [];
  if(req.files && req.files.length){
    req.files.forEach(file=>{
    imgs.push(new Promise((resolve, reject) => {
      let imgObj = { user_id : req.body.user_id, user_board_id : req.body.user_board_id, name : file.key, is_public : 0, is_default : 1};
      ImageService.make('UserBoardImage').create(imgObj).then(
        data=> resolve(data)
      )
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


router.post('/', upload().single('photo'), function (req, res) {
  // Validate request
  console.log('req.body', req.body);
  BaseService.make().create(req.body)
    .then(data => {
      console.log('b4 photo', data)
      if(req.file && req.file.key){
        const imgObj = { user_id : req.body.user_id, user_board_id : data.id, name : req.file.key, is_public : 0, is_default : 1};
          ImageService.make("UserBoardImage").create(imgObj)
      }
      console.log('after photo')
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the " + EntityType + "."
      });
    });
});

router.put('/:id', upload().single('photo'),function (req, res) {
  BaseService.make().update(req.params.id, req.body)
    .then(num => {
      if (num == 1) {
        BaseService.make().find({id : req.params.id})
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(500).send({
            message: "Error retrieving " + EntityType + " with id=" + req.params.id
          });
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


router.delete('/images/:id', function (req, res) {
  const id = req.params.id;

  ImageService.make('UserBoardImage').delete(id)
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