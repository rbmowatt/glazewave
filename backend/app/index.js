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
const imageRouter = require('./routes/images');
const locationRouter = require('./routes/location');
const manufacturerRouter = require('./routes/manufacturer');
const sessionRouter = require('./routes/session');
const userRouter = require('./routes/user');
const userBoardRouter = require('./routes/user_boards');
const stormcastRouter = require('./routes/stormcast');
const cognitoAuthMiddleware = cognitoAuth.getVerifyMiddleware();
const queryParser = require('./middleware/QueryParser');


app.use(queryParser);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({'origin': [cognitoConfig.signoutUri, appConfig.clientUrl ]}));
app.use('/api/user', userRouter);
app.use('/api/board', boardRouter);
app.use('/api/city', cityRouter);
app.use('/api/cognito', cognitoAuthMiddleware, cognitoRouter);
app.use('/api/location', locationRouter);
app.use('/api/manufacturer', manufacturerRouter);
app.use('/api/session', sessionRouter);
app.use('/api/sc', stormcastRouter);
app.use('/api/image', imageRouter);
app.use('/api/user_board', cognitoAuthMiddleware, userBoardRouter);



app.get('/', function (req, res) {
    res.send({ title: "Users API Entry Point" })
  })

module.exports = app;