'use strict';

// SET NULL rather than CASCADE, matching manufacturer_id: removing a shaper
// must not take the board models with it. A board with no shaper is the normal
// case anyway - the harvest supplies no designer at all today.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('boards', 'shaper_id', {
      type: Sequelize.INTEGER(11).UNSIGNED,
      references: {
        model: 'shapers',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // "every model this person designed", which is the query the column exists
    // for. manufacturer_id leads on the second one so it also serves "this
    // label's boards by this designer" - the Firewire case.
    await queryInterface.addIndex('boards', ['shaper_id'], {
      name: 'ix_board_shaper',
    });
    await queryInterface.addIndex('boards', ['manufacturer_id', 'shaper_id'], {
      name: 'ix_board_maker_shaper',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('boards', 'ix_board_maker_shaper');
    await queryInterface.removeIndex('boards', 'ix_board_shaper');
    await queryInterface.removeColumn('boards', 'shaper_id');
  },
};
