const path = require('path');
module.exports =  {
  'config': path.join(__dirname, '../config/mysql.json'),
  'migrations-path': path.join(__dirname, '../migrations'),
  'seeders-path': path.join(__dirname, 'seeders'),
  'models-path': path.join(__dirname, './../models'),
}