const { Router } = require('express');
let upload = require('./../services/images/upload');
const BaseService = require('./../services/UserBoardService');
const ImageService  = require('./../services/ImageService');
const { scopedParser } = require('./../services/rights/Visibility');
const requireOwner = require('./../middleware/RequireOwner');
const requireParentOwner = require('./../middleware/OwnedUpload');
const { discardUploads } = requireParentOwner;
const EntityType = 'UserBoard';

const router = new Router();

/*
 * The router used to be behind cognitoAuthMiddleware, which answers "is this
 * anyone at all" and never "is this row yours" - so any signed-in rider could
 * read every other rider's private boards by asking for them. Writes are still
 * gated; the reads are scoped instead, which is also what lets a board marked
 * public open from a shared link with no account.
 */
router.get('/', function (req, res) {
  BaseService.make().where( scopedParser(req) )
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
  ImageService.make("UserBoardImage").whereVisible( req.parser, req.viewer )
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
  req.parser.id = req.params.id;
  BaseService.make().findVisible({id: req.params.id, withs: req.parser.withs, viewer: req.viewer})
    .then(data => {
      if (!data) {
        return res.status(404).send({
          message: `Cannot find ${EntityType} with id=${req.params.id}.`
        });
      }
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving " + EntityType + " with id=" + req.query.id
      });
    });
});


router.post('/images',
  upload({destinationPath : 'user_boards'}).array('photo'),
  requireParentOwner({ field: 'user_board_id', find: (id) => BaseService.make().find({ id: id, withs: [] }) }),
  function (req, res) {
  const imgs = [];
  if(req.files && req.files.length){
    req.files.forEach(file=>{
    imgs.push(new Promise((resolve, reject) => {
      let imgObj = { user_id : req.viewer.id, user_board_id : req.body.user_board_id, name : file.key, is_public : 0, is_default : 1};
      ImageService.make('UserBoardImage').create(imgObj).then(
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


router.post('/', upload({destinationPath : 'user_boards'}).single('photo'), function (req, res) {
  // user_id came off the body. A board created against another rider's id
  // carries a rating into their shelf, and that rating feeds the composite
  // board_ratings score everybody sees.
  /*
   * discardUploads, not a bare 401: multer has already streamed the photo into
   * S3 by the time this runs. authWrites means the token is valid, so the only
   * way here is the window between a Cognito signup and the firstOrNew that
   * mints the users row - which is a new rider's very first upload. The bucket
   * is versioned, so an orphan left now costs bytes forever.
   */
  if (!req.viewer) {
    return discardUploads(req)
      .then(() => res.status(401).send({ message: 'Sign in first.' }));
  }
  BaseService.make().create(Object.assign({}, req.body, { user_id: req.viewer.id }))
    .then(data => {
      if(req.file && req.file.key){
        const imgObj = { user_id : req.viewer.id, user_board_id : data.id, name : req.file.key, is_public : 0, is_default : 1};
          ImageService.make("UserBoardImage").create(imgObj)
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

/*
 * Ownership matters more here than it looks: a user_board's rating feeds the
 * composite board_ratings score for that model, so an unowned edit moves a
 * number shown to everyone, not just one rider's shelf.
 */
router.put('/:id',
  requireOwner({ find: (id) => BaseService.make().find({ id: id, withs: [] }) }),
  upload({destinationPath : 'user_boards'}).single('photo'),
  function (req, res) {
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

router.delete('/:id',
  requireOwner({ find: (id) => BaseService.make().find({ id: id, withs: [] }) }),
  function (req, res) {
  const id = req.params.id;

  BaseService.make().delete(id)
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


router.delete('/images/:id',
  requireOwner({ find: (id) => ImageService.make('UserBoardImage').find({ id: id, withs: [] }) }),
  function (req, res) {
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