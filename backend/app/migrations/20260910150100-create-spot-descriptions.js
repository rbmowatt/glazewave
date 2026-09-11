'use strict';

/*
 * Revision log for a spot's description. Append only - a row is never updated
 * and never deleted, so the newest row for a spot is the history and the one
 * before it is what to revert to.
 *
 * THE CURRENT TEXT IS NOT HERE. It is denormalized onto surfline_spots.notes,
 * which GET /api/spot/:id already selects, so the read path takes no join.
 * Measured before reusing that column: 0 of 1,611 rows have anything in it,
 * so it carries no other meaning to lose.
 *
 * Exactly one service writes both halves in a transaction. Editing notes by
 * hand produces a current text that disagrees with the history claiming to
 * explain it - the same rule board_ratings carries, for the same reason.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('spot_descriptions', {
      id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      // 255 to match surfline_spots.id, for the same reason spot_notes does:
      // a Google place id runs past the 191 spot_images uses.
      spot_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        references: { model: 'surfline_spots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      // generated: built from the columns the spot already has, and marked as
      // a stub on the page so it reads as something to replace.
      // user: a rider rewrote it. admin: the console did.
      source: {
        type: Sequelize.ENUM('generated', 'user', 'admin'),
        allowNull: false,
      },
      // NULL for a generated revision - nobody wrote it. SET NULL rather than
      // CASCADE: deleting an account must not erase the history of what the
      // description said, only who said it.
      user_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('spot_descriptions', {
      name: 'ix_spot_descriptions_history',
      fields: [{ name: 'spot_id', length: 191 }, 'created_at'],
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('spot_descriptions');
  },
};
