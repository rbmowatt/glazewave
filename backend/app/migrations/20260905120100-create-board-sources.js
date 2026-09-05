'use strict';

// One row per source system, not per record. `redistributable` is what stops
// EOS prose reaching a public template.
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('board_sources', {
      id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      source_key: {
        type: Sequelize.STRING(80),
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
      terms_url: {
        type: Sequelize.STRING(255),
      },
      redistributable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      default_license_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        references: {
          model: 'image_licenses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: {
        type: Sequelize.TEXT,
      },
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
    return queryInterface.dropTable('board_sources');
  },
};
