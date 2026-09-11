'use strict';

/*
 * The spot page's note thread. One level deep: a note, and replies to it.
 *
 * spot_id is VARCHAR(255) to match surfline_spots.id exactly rather than the
 * 191 spot_images uses. 191 is the utf8mb4 767-byte index convention and it
 * fits every OSM id, but the table also holds Google place ids - the long
 * "Eid..." encoded form runs past 110 characters - and a note on one of those
 * would fail to insert. The index takes a 191-character prefix instead, which
 * costs nothing: ids are distinct long before that.
 *
 * is_hidden rather than a delete. There is no admin console yet, so hiding a
 * note today means an SSM session and a hand-written UPDATE - recoverable.
 * A DELETE at that keyboard is not, and this project has no way to get a row
 * back.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('spot_notes', {
      id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      spot_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        references: { model: 'surfline_spots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // CASCADE, unlike every other user foreign key here: a note is speech,
      // and a deleted account should not leave attributable text behind.
      user_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // NULL is a top-level note. The one-level rule is enforced in the
      // service, not here - MySQL cannot express "the parent has no parent",
      // and a CHECK that could would still not stop a later UPDATE.
      parent_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        allowNull: true,
        references: { model: 'spot_notes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_hidden: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('spot_notes', {
      name: 'ix_spot_notes_thread',
      fields: [{ name: 'spot_id', length: 191 }, 'parent_id', 'created_at'],
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('spot_notes');
  },
};
