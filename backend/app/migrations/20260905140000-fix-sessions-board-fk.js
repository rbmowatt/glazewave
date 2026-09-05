'use strict';

// sessions.board_id was created with a foreign key onto `boards`, the catalog
// table, but the model has always associated it to UserBoard and the app writes
// user_boards.id into it:
//
//   Session.belongsTo(models.UserBoard, {foreignKey: 'board_id', targetKey: 'id'})
//
// So picking a board only saved when the chosen user_boards.id happened to also
// exist in boards. Any other value failed the constraint, the route turned that
// into a bare 500, and the board looked like it silently refused to stick.
//
// A session is ridden on a person's own board, so user_boards is the correct
// target and the original reference was the mistake.
module.exports = {
  up: async (queryInterface) => {
    const [rows] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME AS name
        FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'sessions'
         AND COLUMN_NAME = 'board_id'
         AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    for (const row of rows) {
      await queryInterface.sequelize.query(
        `ALTER TABLE sessions DROP FOREIGN KEY \`${row.name}\``
      );
    }

    // Rows written while the constraint pointed at the wrong table can hold a
    // boards.id that means nothing as a user_boards.id. The new constraint
    // cannot be created while those are present, and there is no way to tell
    // which board was meant, so they are cleared rather than guessed at.
    await queryInterface.sequelize.query(`
      UPDATE sessions s
        LEFT JOIN user_boards ub ON ub.id = s.board_id
         SET s.board_id = NULL
       WHERE s.board_id IS NOT NULL
         AND ub.id IS NULL
    `);

    await queryInterface.addConstraint('sessions', {
      fields: ['board_id'],
      type: 'foreign key',
      name: 'fk_sessions_board_user_boards',
      references: { table: 'user_boards', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeConstraint('sessions', 'fk_sessions_board_user_boards');
    await queryInterface.addConstraint('sessions', {
      fields: ['board_id'],
      type: 'foreign key',
      name: 'sessions_ibfk_board_id',
      references: { table: 'boards', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
};
