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
const imageRouter = require('./routes/images');
const locationRouter = require('./routes/location');
const manufacturerRouter = require('./routes/manufacturer');
const sessionRouter = require('./routes/session');
const shaperRouter = require('./routes/shaper');
const userRouter = require('./routes/user');
const userBoardRouter = require('./routes/user_boards');
const conditionsRouter = require('./routes/conditions');
const spotRouter = require('./routes/spot');
const esRouter = require('./routes/es');
const cognitoAuthMiddleware = cognitoAuth.getVerifyMiddleware();
const queryParser = require('./middleware/QueryParser');
const viewer = require('./middleware/Viewer');
const demoReadOnly = require('./middleware/DemoReadOnly');

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
app.use('/api/city', guardedWrites, cityRouter);
/*
 * demoReadOnly here too: this router's PUT and DELETE take a username from the
 * URL and sit behind "is this a valid token", so a demo token reached
 * DELETE /api/cognito/:uname on any account it could name.
 */
app.use('/api/cognito', cognitoAuthMiddleware, demoReadOnly, cognitoRouter);
app.use('/api/demo', demoRouter);
app.use('/api/location', guardedWrites, locationRouter);
app.use('/api/manufacturer', guardedWrites, manufacturerRouter);
app.use('/api/session', guardedWrites, sessionRouter);
app.use('/api/shaper', guardedWrites, shaperRouter);
app.use('/api/spot', guardedWrites, spotRouter);
app.use('/api/sc', conditionsRouter);
app.use('/api/image', guardedWrites, imageRouter);
/*
 * Reads here are open for the same reason the session ones are: a board is
 * shareable when its owner marks it public, and the router scopes every read to
 * owner-or-public. It was behind cognitoAuthMiddleware outright, which is what
 * made /board/:id sign-in-only however the toggle was set.
 */
app.use('/api/user_board', guardedWrites, userBoardRouter);
app.use('/api/es', cognitoAuthMiddleware, esRouter);



app.get('/', function (req, res) {
    res.send({ title: "Users API Entry Point" })
  })

module.exports = app;