'use strict';
const data = require('../../../data/surfline_spots.json');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('surfline_spots', data, {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('surfline_spots', null, {});
  }
};
