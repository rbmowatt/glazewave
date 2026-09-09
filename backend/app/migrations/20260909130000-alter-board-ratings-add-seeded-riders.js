'use strict';

/*
 * How many of a model's riders are demo_peer_ accounts, seeded by
 * demo_seed.js so the community score has something to average while the demo
 * account is the only real one. Non-zero is what makes the page admit they are
 * in there.
 *
 * Self-clearing: remove the seeded riders, run the recompute, and this goes to
 * 0 with nothing to switch off by hand.
 *
 * Its own migration rather than a column on the create, because the create had
 * already run against the box by the time this was wanted. Amending an applied
 * migration changes nothing on a database that has recorded it and breaks the
 * next fresh one.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('board_ratings', 'seeded_riders', {
      type: Sequelize.SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('board_ratings', 'seeded_riders');
  },
};
