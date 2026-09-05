'use strict';

// The merge table and the citation table are the same table. payload holds the
// source record verbatim, including prose that must never reach a public
// template: only the facts get promoted into boards columns.
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('board_model_sources', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      board_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        allowNull: false,
        references: { model: 'boards', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      source_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        allowNull: false,
        references: { model: 'board_sources', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      source_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      // The source's own identifier: a Shopify handle, an EOS slug. Part of the
      // unique key so a re-harvest updates rather than appends.
      source_ref: {
        type: Sequelize.STRING(180),
      },
      payload: {
        type: Sequelize.JSON,
      },
      fetched_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    }).then(() => queryInterface.addIndex(
      'board_model_sources',
      ['board_id', 'source_id', 'source_ref'],
      { name: 'uq_board_source_ref', unique: true }
    ));
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('board_model_sources');
  },
};
