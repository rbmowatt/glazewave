'use strict';

/*
 * is_active has existed since the original users migration and nothing has
 * ever read it, so its contents were never maintained. Enforcement lands in
 * Viewer.js in the same change as this, and enforcing a nullable column would
 * lock out every row that happens to hold NULL.
 *
 * NULL means "nobody ever set this", which is an ordinary account, so it
 * backfills to 1. Existing ZEROS are left alone deliberately: demo_seed.js
 * writes the demo_peer_* rider rows with is_active 0, and those exist only so
 * the composite board score has something to average. They never authenticate,
 * so treating 0 as disabled does not disturb them - but it does mean 0 now
 * carries two meanings, "seeded peer" and "banned", and only the absence of a
 * Cognito account separates them.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      'UPDATE users SET is_active = 1 WHERE is_active IS NULL'
    );
    await queryInterface.changeColumn('users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Only the constraint comes off. Restoring the NULLs would mean recording
    // which rows held one, and nothing wants them back.
    await queryInterface.changeColumn('users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: null,
    });
  },
};
