const { Router } = require('express');
const BaseService = require('./../services/UserService');
const UserBoardService = require('./../services/UserBoardService');
const EntityType = 'User';
let upload = require('./../services/images/upload');


const router = new Router();

/*
 * There is no collection read here on purpose. GET /api/user answered anyone
 * who could resolve the host with every row, email included, and the one page
 * that called it (UserIndex) had a role check that read `if (false)`. A rider's
 * name and photo reach other people through with[]=User, which QueryParser
 * filters to RELATION_ATTRIBUTES; there is no case for handing out the table.
 *
 * Everything below is self-only. A verified token says who you are, not what
 * you may touch, and these routes each carry a rider's own record.
 */
const self = (req, res, id) => {
  if (!req.viewer) {
    res.status(401).send({ message: 'Sign in first.' });
    return false;
  }
  if (String(req.viewer.id) !== String(id)) {
    res.status(403).send({ message: 'That is not your account.' });
    return false;
  }
  return true;
};

// Aggregated over every session the rider has, private ones included, so this
// is as much theirs as the rows behind it.
router.get('/:id/average', function (req, res) {
  if (!self(req, res, req.params.id)) return;
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


/*
 * The one route that answers before a users row exists, so it cannot use
 * req.viewer - req.tokenUsername is the verified Cognito username on its own.
 *
 * It used to take the username from the query string with no token at all, so
 * ?username=someone returned that rider's row, email included, to anybody who
 * guessed a name. The token has always been in hand at the call site: cognito.js
 * runs this inside getSession(), where result.accessToken is already resolved.
 */
router.get('/firstOrNew', function (req, res) {
  if (!req.tokenUsername) {
    return res.status(401).send({ message: 'Sign in first.' });
  }
  if (req.tokenUsername !== req.query.username) {
    return res.status(403).send({ message: 'That is not your account.' });
  }
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
  if (!self(req, res, req.params.id)) return;
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


/*
 * No POST / either. It created a user from an arbitrary body, and the only
 * caller was the Create User page that came off UserIndex. An account is
 * created by Cognito and mirrored here by firstOrNew above, which is the one
 * path that can prove the row it makes belongs to the caller.
 */

// Nothing calls this - every board write goes to /api/user_board - but it is
// mounted, and it took user_id from the body.
router.post('/board', upload({destinationPath : 'board'}).single('photo'), function (req, res) {
  if (!req.viewer) {
    return res.status(401).send({ message: "Sign in first." });
  }
  UserBoardService.make().create(Object.assign({}, req.body, {user_id: req.viewer.id}))
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
  // req.body.user_id came off a multipart form, so it was the uploader's to
  // choose and any signed-in rider could overwrite anyone's avatar.
  if (!req.viewer) {
    return res.status(401).send({ message: "Sign in first." });
  }
  BaseService.make().update(req.viewer.id,  {profile_img : req.file.key })
    .then(data => {
      if (!data) {
        return res.status(404).send({
          message: `Cannot update ${EntityType} with id=${req.viewer.id}.`
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
  if (!self(req, res, req.params.id)) return;
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
  if (!self(req, res, req.params.id)) return;
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