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
        "operatorsAliases": false
    }
  }