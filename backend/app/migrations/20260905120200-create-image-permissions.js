'use strict';

// The evidence behind a brand-permission image: who said yes, when, and where
// the email is. Without a row here a brand-permission license never leaves
// display_scope = 'internal'.
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('image_permissions', {
      id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      manufacturer_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        references: {
          model: 'manufacturers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      source_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        references: {
          model: 'board_sources',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      granted_by: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      granted_at: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATEONLY,
      },
      scope: {
        type: Sequelize.ENUM('catalog', 'editorial', 'any'),
        allowNull: false,
        defaultValue: 'catalog',
      },
      evidence_url: {
        type: Sequelize.STRING(500),
      },
      evidence_note: {
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
    return queryInterface.dropTable('image_permissions');
  },
};
