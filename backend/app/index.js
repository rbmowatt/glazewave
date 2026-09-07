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


app.use(queryParser);
// After queryParser, because it hangs the resolved viewer on req.parser too.
app.use(viewer);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({'origin': [cognitoConfig.signoutUri, appConfig.clientUrl ]}));
app.use('/api/user', authWrites, userRouter);
app.use('/api/board', boardRouter);
app.use('/api/city', authWrites, cityRouter);
app.use('/api/cognito', cognitoAuthMiddleware, cognitoRouter);
app.use('/api/demo', demoRouter);
app.use('/api/location', authWrites, locationRouter);
app.use('/api/manufacturer', authWrites, manufacturerRouter);
app.use('/api/session', authWrites, sessionRouter);
app.use('/api/shaper', authWrites, shaperRouter);
app.use('/api/spot', authWrites, spotRouter);
app.use('/api/sc', conditionsRouter);
app.use('/api/image', authWrites, imageRouter);
app.use('/api/user_board', cognitoAuthMiddleware, userBoardRouter);
app.use('/api/es', cognitoAuthMiddleware, esRouter);



app.get('/', function (req, res) {
    res.send({ title: "Users API Entry Point" })
  })

module.exports = app;