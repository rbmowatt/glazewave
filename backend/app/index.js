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

/*
 * Every CRUD router below used to be mounted bare, so POST, PUT and DELETE on
 * users, sessions, locations, cities, manufacturers, images and spots answered
 * to anyone who could resolve the host. DELETE /api/user/:id was the worst of
 * them.
 *
 * The reads have to stay open. BoardPicker asks for a session before the
 * Cognito token has rehydrated and reads the board off that payload rather
 * than 401ing, and lib/utils/cognito.js calls /api/user/firstOrNew during
 * login with a bare axios.get that carries no Authorization header at all.
 * Gate the verbs, not the router.
 *
 * A valid token is not the same as owning the row: nothing here checks that
 * the session you are editing is yours. That still has to be done per route.
 */
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const authWrites = (req, res, next) =>
  WRITE_METHODS.includes(req.method)
    ? cognitoAuthMiddleware(req, res, next)
    : next();


app.use(queryParser);
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