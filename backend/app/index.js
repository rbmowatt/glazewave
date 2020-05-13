const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const userRouter = require('./routes/user');
const recipeRouter = require('./routes/recipe');
const appConfig = require('./config/app');
const cognitoConfig = require('./config/cognito');
const cognitoAuth = require('./lib/cognitoAuth');
const cognitoAuthMiddleware = cognitoAuth.getVerifyMiddleware()

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({'origin': [cognitoConfig.signoutUri, appConfig.clientUrl ]}));

app.use('/api/user', cognitoAuthMiddleware, userRouter);
app.use('/api/recipe', recipeRouter);
app.get('/', function (req, res) {
    res.send({ title: "Users API Entry Point" })
  })

module.exports = app;