'use strict';

/*
 * Runtime switches the admin panel flips without a deploy. The alternative was
 * env vars, and neither half of that works here: REACT_APP_* is inlined at
 * build time, and a backend value means editing /opt/glazewave/backend/.env
 * over SSM and restarting the unit. Neither is a switch.
 *
 * setting_key, not `key`. KEY is reserved in MySQL 8, so every raw query
 * touching it would need backticks - the same trap that made DisplayScope's
 * reconcile SQL a syntax error on `stored` the first time it ever ran.
 *
 * NO ROWS ARE SEEDED. A flag with no row reads as off, and that default lives
 * in AppSettings.js rather than here. There is no seederStorage configured on
 * this project, so nothing records whether a seeder ran - the CC-ports licence
 * seeder had already gone unrun on the box once - and a flag that defaults on
 * when its row is missing is a feature that turns itself on the first time a
 * database is restored.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('app_settings', {
      setting_key: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false,
      },
      // Stringly typed on purpose: today these are three booleans, and a
      // value_type column would be scaffolding for a shape nothing has yet.
      // AppSettings.enabled() is the only reader and it decides what true is.
      value: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      // Who flipped it last. SET NULL rather than CASCADE: losing the admin
      // must not silently switch a live feature off by deleting its row.
      updated_by: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('app_settings');
  },
};
