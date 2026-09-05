'use strict';

// Ten rows govern several thousand images, so a rule change is one UPDATE here
// rather than a pass over board_images.
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('image_licenses', {
      id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      code: {
        type: Sequelize.STRING(60),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING(255),
      },
      requires_attribution: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      // Everything defaults to forbidden. An unclassified image has to be
      // invisible, not visible.
      allows_public_display: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      allows_redistribution: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      allows_commercial: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      needs_grant: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      attribution_template: {
        type: Sequelize.STRING(255),
      },
      // Sibling migrations bake `new Date()` into the column default, which
      // freezes it at the moment the migration file was written.
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('image_licenses');
  },
};
