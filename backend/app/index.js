const express = require('express');
const app = express();
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const appConfig = require('./config/app');
const cognitoConfig = require('./config/cognito');
const cognitoAuth = require('./lib/cognitoAuth');
const boardRouter = require('./routes/board');
const cityRouter = require('./routes/city');
const cognitoRouter = require('./routes/cognito');
const demoRouter = require('./routes/demo');
const locationRouter = require('./routes/location');
const manufacturerRouter = require('./routes/manufacturer');
const sessionRouter = require('./routes/session');
const shaperRouter = require('./routes/shaper');
const userRouter = require('./routes/user');
const userBoardRouter = require('./routes/user_boards');
const conditionsRouter = require('./routes/conditions');
const spotRouter = require('./routes/spot');
const spotNoteRouter = require('./routes/spot_notes');
const esRouter = require('./routes/es');
const adminRouter = require('./routes/admin');
const cognitoAuthMiddleware = cognitoAuth.getVerifyMiddleware();
const queryParser = require('./middleware/QueryParser');
const viewer = require('./middleware/Viewer');
const demoReadOnly = require('./middleware/DemoReadOnly');
const requireAdmin = require('./middleware/RequireAdmin');

/*
 * Every CRUD router below used to be mounted bare, so POST, PUT and DELETE on
 * users, sessions, locations, cities, manufacturers, images and spots answered
 * to anyone who could resolve the host. DELETE /api/user/:id was the worst of
 * them.
 *
 * The reads have to stay open. BoardPicker asks for a session before the
 * Cognito token has rehydrated and reads the board off that payload rather
 * than 401ing, and a public session is meant to open from a shared link with
 * no account at all. Gate the verbs, not the router - and scope the reads.
 * (/api/user/firstOrNew used to be the other reason. It carries its token
 * now, because it always had one in hand.)
 *
 * A valid token is not the same as owning the row. The READS are scoped now -
 * viewer below resolves the caller without refusing anyone, and the session,
 * user_board and image routes AND owner-or-public onto every query. The WRITES
 * still are not: PUT and DELETE on a session or a board check that you are
 * someone, not that the row is yours. That is the next pass.
 */
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const authWrites = (req, res, next) =>
  WRITE_METHODS.includes(req.method)
    ? cognitoAuthMiddleware(req, res, next)
    : next();

/*
 * Paired with authWrites on every CRUD router, which is exactly the set that
 * needs it. /api/es is deliberately not in that set: its searches are POSTs
 * that read, and refusing them would leave the demo with an empty board list
 * rather than a read-only one. /api/demo is not either, or the login that
 * mints the token would refuse itself.
 */
const guardedWrites = [authWrites, demoReadOnly];

/*
 * Catalog data - makers, shapers, cities, locations - has no owner, so
 * ownership cannot gate it and "a valid token" was the whole check. Any signed
 * in rider could rename or delete every manufacturer in the board catalog.
 *
 * Nothing in frontend/src writes to any of these: the board form picks from
 * the lists and there is no create-a-maker flow, so admin-only writes cost the
 * app nothing today.
 */
const adminWrites = (req, res, next) =>
  WRITE_METHODS.includes(req.method) ? requireAdmin(req, res, next) : next();

const catalogWrites = [authWrites, demoReadOnly, adminWrites];


app.use(queryParser);
// After queryParser, because it hangs the resolved viewer on req.parser too.
app.use(viewer);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({'origin': [cognitoConfig.signoutUri, appConfig.clientUrl ]}));
app.use('/api/user', guardedWrites, userRouter);
app.use('/api/board', boardRouter);
app.use('/api/city', catalogWrites, cityRouter);
/*
 * Every route in here is an admin action on the user pool - listUsers,
 * adminCreateUser, adminUpdateUserAttributes, adminDeleteUser - and the whole
 * router sat behind "is this a valid token". GET / returned every registered
 * user with email and phone, and it is a read, so demoReadOnly never saw it.
 *
 * The calls fail at AWS today only because infra/iam.tf grants the instance
 * role SSM and S3 and no cognito-idp at all. THAT is the thing keeping this
 * safe, not the route table - so the IAM statement for AdminDisableUser must
 * not land before this gate does.
 *
 * demoReadOnly is gone from here because requireAdmin subsumes it: a demo
 * token is refused on its kid before its groups are even read.
 */
app.use('/api/cognito', cognitoAuthMiddleware, requireAdmin, cognitoRouter);
app.use('/api/demo', demoRouter);
app.use('/api/location', catalogWrites, locationRouter);
app.use('/api/manufacturer', catalogWrites, manufacturerRouter);
app.use('/api/session', guardedWrites, sessionRouter);
app.use('/api/shaper', catalogWrites, shaperRouter);
app.use('/api/spot', guardedWrites, spotRouter);
// Its own mount, not a suffix under /api/spot/:id(*): editing a note needs
// only the note id, and stacking a second wildcard suffix there makes the
// route table depend on backtracking to read correctly.
app.use('/api/spot-note', guardedWrites, spotNoteRouter);
app.use('/api/sc', conditionsRouter);
/*
 * /api/image is NOT mounted. routes/images.js calls BaseService.make() with no
 * model name, so ImageService runs super(db[undefined]) and every handler
 * throws on this.BaseModel - verified against production, where GET
 * /api/image/1 answers 500 "Error retrieving Location with id=1".
 *
 * It cannot simply be guarded either: it resolves to location_images, which
 * has no user_id column, so there is no ownership to check. Session and board
 * photos are served by their own routers. Decide what this router is for
 * before mounting it again.
 */
/*
 * Reads here are open for the same reason the session ones are: a board is
 * shareable when its owner marks it public, and the router scopes every read to
 * owner-or-public. It was behind cognitoAuthMiddleware outright, which is what
 * made /board/:id sign-in-only however the toggle was set.
 */
app.use('/api/user_board', guardedWrites, userBoardRouter);
app.use('/api/es', cognitoAuthMiddleware, esRouter);

/*
 * The gate is on the mount, not inside the router: every route under here is
 * an admin action and none of them has an anonymous form.
 *
 * requireAdmin reads req.viewer.isAdmin, which Viewer resolves for every
 * request - so cognitoAuthMiddleware is here for its 401, not for the group
 * check. Without it a missing token would answer 403 "admins only", which
 * sends the console to its not-an-admin screen instead of to the login.
 */
app.use('/api/admin', cognitoAuthMiddleware, requireAdmin, adminRouter);



app.get('/', function (req, res) {
    res.send({ title: "Users API Entry Point" })
  })

module.exports = app;