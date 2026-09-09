'use strict';

/*
 * Read-only from the application's point of view. Every write goes through
 * services/rating/BoardRating.js, which recomputes a whole model's row from
 * user_boards in one statement - updating a column here by hand produces a
 * score that disagrees with the ratings it claims to summarize.
 */
module.exports = (sequelize, DataTypes) => {
  const BoardRating = sequelize.define('BoardRating', {
    board_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    rating_avg: DataTypes.DECIMAL(4, 2),
    rating_count: DataTypes.INTEGER,
    seeded_riders: DataTypes.INTEGER,
    ranking_score: DataTypes.DECIMAL(6, 4),
  }, {underscored: true, tableName: 'board_ratings'});

  BoardRating.associate = function(models) {
    BoardRating.belongsTo(models.Board, {foreignKey: 'board_id'});
  };
  return BoardRating;
};
