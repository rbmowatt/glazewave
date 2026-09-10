const { Router } = require('express');
let upload = require('./../services/images/upload');
const BaseService = require('./../services/SessionService');
const ImageService  = require('./../services/ImageService');
const { scopedParser } = require('./../services/rights/Visibility');
const requireOwner = require('./../middleware/RequireOwner');
const requireParentOwner = require('./../middleware/OwnedUpload');
const { discardUploads } = requireParentOwner;
const EntityType = 'Session';

const router = new Router();

/*
 * Open to anonymous callers on purpose - a public session opens from a shared
 * link and App.js routes /session/:id without PrivateRoute. scopedParser is
 * what keeps "open" from meaning "everyone's rows": the caller's filters are
 * ANDed with owner-or-public, which they cannot widen from the query string.
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
  ImageService.make('SessionImage').whereVisible( req.parser, req.viewer )
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

router.post('/images',
  upload({destinationPath : 'user_sessions'}).array('photo'),
  requireParentOwner({ field: 'session_id', find: (id) => BaseService.make().find({ id: id, withs: [] }) }),
  function (req, res) {
  const imgs = [];
  if(req.files && req.files.length){
    req.files.forEach(file=>{
    imgs.push(new Promise((resolve, reject) => {
      // user_id off the token, not the form. It used to come from the
      // multipart body, so the photo recorded whoever the client named.
      let imgObj = { user_id : req.viewer.id, session_id : req.body.session_id, name : file.key, is_public : 0, is_default : 1};
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
  BaseService.make().findVisible({id: req.params.id, withs: req.parser.withs, viewer: req.viewer})
    .then(data => {
      // A private session answers exactly like a missing one, so an id cannot
      // be probed for existence.
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


router.post('/', upload({destinationPath : 'user_sessions'}).array('photo'), function (req, res) {
  if (!req.body.title) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // user_id came off the body, so a rider could log a session onto somebody
  // else's account - and the rows behind /api/user/:id/average with it.
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

  // req.body.conditions is ignored. The client still sends it because the form
  // shows a preview, but SessionService resolves and writes the real row from
  // the session's own location and date - a browser payload cannot be trusted
  // to agree with the timestamp it was saved beside.
  BaseService.make().create(Object.assign({}, req.body, { user_id: req.viewer.id }))
    .then(data => {
      if(req.files && req.files.length){
        req.files.forEach(file=>{
          let imgObj = { user_id : req.viewer.id, session_id : data.id, name : file.key, is_public : 0, is_default : 1};
          ImageService.make('SessionImage').create(imgObj)
        })
      }
      res.send(data);
    })
    .catch(err => {
      console.error('POST /api/session failed:', err);
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the " + EntityType + "."
      });
    });
});

/*
 * requireOwner ahead of the upload, not after it: multer pushes the photo into
 * S3 as it parses the multipart body, so checking later stores a file for a
 * request that is about to be refused.
 */
router.put('/:id',
  requireOwner({ find: (id) => BaseService.make().find({ id: id, withs: [] }) }),
  upload({destinationPath : 'user_sessions'}).single('photo'),
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

router.delete('/:id',
  requireOwner({ find: (id) => BaseService.make().find({ id: id, withs: [] }) }),
  function (req, res) {
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

// session_images carries its own user_id, so the photo is checked directly
// rather than through the session it hangs off.
router.delete('/images/:id',
  requireOwner({ find: (id) => ImageService.make('SessionImage').find({ id: id, withs: [] }) }),
  function (req, res) {
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