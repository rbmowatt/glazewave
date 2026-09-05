require('dotenv').config();
module.exports = {
    "development": {
        "username": process.env.MYSQL_UNAME,
        "password": process.env.MYSQL_PWD,
        "database": process.env.MYSQL_DB,
        "host": process.env.MYSQL_HOST,
        "port": process.env.MYSQL_PORT,
        "dialect": "mysql",
        "operatorsAliases": false
    },
    "test": {
        "username": process.env.MYSQL_UNAME,
        "password": process.env.MYSQL_PWD,
        "database": process.env.MYSQL_DB,
        "host": process.env.MYSQL_HOST,
        "port": process.env.MYSQL_PORT,
        "dialect": "mysql",
        "operatorsAliases": false
    },
    "production": {
        "username": process.env.MYSQL_UNAME,
        "password": process.env.MYSQL_PWD,
        "database": process.env.MYSQL_DB,
        "host": process.env.MYSQL_HOST,
        "port": process.env.MYSQL_PORT,
        "dialect": "mysql",
        "operatorsAliases": false,
        // Every query was going to journalctl, which is the only place the
        // real cause of a 500 appears at all - finalhandler replaces the
        // response body with the bare status phrase under NODE_ENV=production.
        // The one readable log was buried under the projection SELECT.
        "logging": false
    }
  }