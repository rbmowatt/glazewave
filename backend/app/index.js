const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const userRouter = require('./api/user');
const recipeRouter = require('./api/recipe');
const appConfig = require('./config/app');
const cognitoConfig = require('./config/cognito');
const cognitoAuth = require('./lib/cognitoAuth');
const cognitoAuthMiddleware = cognitoAuth.getVerifyMiddleware()

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({'origin': [cognitoConfig.signoutUri, appConfig.clientUrl ]}));

app.use('/user', cognitoAuthMiddleware, userRouter);
app.use('/recipe', recipeRouter);
app.get('/', function (req, res) {
    res.send({ title: "Users API Entry Point" })
  })

module.exports = app;