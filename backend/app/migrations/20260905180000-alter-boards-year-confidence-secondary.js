'use strict';

// 'secondary' sits between 'title' and 'stated': a compiled reference work
// asserts the year outright, which beats a year lifted out of a model name,
// but it carries no per-entry citation and must never outrank EOS.
const LEVELS = ['field', 'stated', 'secondary', 'title', 'mentioned', 'boilerplate'];

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.changeColumn('boards', 'year_confidence', {
    type: Sequelize.ENUM(...LEVELS),
  }),

  // Rows written as 'secondary' become '' under a narrowed ENUM rather than
  // failing, so they are cleared first.
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "UPDATE boards SET year_confidence = NULL, year_introduced = NULL WHERE year_confidence = 'secondary'"
    );
    return queryInterface.changeColumn('boards', 'year_confidence', {
      type: Sequelize.ENUM('field', 'stated', 'title', 'mentioned', 'boilerplate'),
    });
  },
};
