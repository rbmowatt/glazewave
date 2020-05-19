const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const appConfig = require('./config/app');
const cognitoConfig = require('./config/cognito');
const cognitoAuth = require('./lib/cognitoAuth');
const cognitoAuthMiddleware = cognitoAuth.getVerifyMiddleware();
const db = require("./models");
const boardRouter = require('./routes/board');
const cityRouter = require('./routes/city');
const locationRouter = require('./routes/location');
const recipeRouter = require('./routes/recipe');
const sessionRouter = require('./routes/session');
const userRouter = require('./routes/user');

//db.sequelize.sync();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({'origin': [cognitoConfig.signoutUri, appConfig.clientUrl ]}));
app.use('/api/board', boardRouter);
app.use('/api/city', cityRouter);
app.use('/api/location', locationRouter);
app.use('/api/recipe', recipeRouter);
app.use('/api/session', sessionRouter);
app.use('/api/user', cognitoAuthMiddleware, userRouter);

app.get('/', function (req, res) {
    res.send({ title: "Users API Entry Point" })
  })

module.exports = app;