'use strict';

/*
 * The community score for a catalog model, kept as a stored summary rather
 * than computed per request: the board list would otherwise re-aggregate
 * every rider's boards on every page load.
 *
 * board_id is the primary key, not a surrogate. There is exactly one score
 * per model, and the recompute upserts on it.
 *
 * CASCADE, where every other board foreign key in this schema is SET NULL.
 * These rows are derived - an orphan is a score nothing can recompute and
 * nothing will ever delete.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('board_ratings', {
      board_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'boards',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // The plain mean across riders on the 1-10 star scale. This is the
      // number a card shows. Two decimals because the UI renders toFixed(1)
      // and rounding a value that was already rounded once drifts.
      rating_avg: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: false,
      },
      // Distinct riders, not ratings: a rider who owns three of one model
      // counts once. This is also what the minimum-riders gate reads.
      rating_count: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
      },
      // How many of those riders are demo_peer_ accounts, seeded so the
      // feature has something to show before real riders arrive. Non-zero is
      // what makes the page admit it. Self-clearing: remove the seeded riders,
      // recompute, and it goes to 0 with nothing to switch off by hand.
      seeded_riders: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      // rating_avg pulled toward the catalog mean by how few riders it rests
      // on. Order by this, display rating_avg - they disagree most for
      // exactly the models where the average is least trustworthy.
      ranking_score: {
        type: Sequelize.DECIMAL(6, 4),
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date(),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date(),
      },
    });

    // "Best rated boards with enough riders to mean anything", which is the
    // only ordered read this table has. rating_count leads because it is the
    // filter and ranking_score is the sort.
    await queryInterface.addIndex('board_ratings', ['rating_count', 'ranking_score'], {
      name: 'ix_board_rating_rank',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('board_ratings', 'ix_board_rating_rank');
    await queryInterface.dropTable('board_ratings');
  },
};
