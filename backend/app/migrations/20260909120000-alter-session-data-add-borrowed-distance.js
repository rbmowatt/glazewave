'use strict';

// Nullable with no backfill on purpose. A null means either the reading is the
// session's own place or the row predates this column, and those are not worth
// telling apart: rows written before it existed were resolved under a 25km
// borrow radius that almost never fired outside dense coast.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('session_data', 'borrowed_m', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('session_data', 'borrowed_m');
  },
};
