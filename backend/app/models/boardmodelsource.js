'use strict';
module.exports = (sequelize, DataTypes) => {
  const BoardModelSource = sequelize.define('BoardModelSource', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    board_id: DataTypes.INTEGER,
    source_id: DataTypes.INTEGER,
    source_url: DataTypes.STRING,
    source_ref: DataTypes.STRING,
    // Holds the source record verbatim, prose included. Nothing in here is
    // rendered publicly unless its BoardSource is redistributable.
    payload: DataTypes.JSON,
    fetched_at: DataTypes.DATE,
  }, {underscored: true, tableName: 'board_model_sources'});
  BoardModelSource.associate = function(models) {
    BoardModelSource.belongsTo(models.Board, {foreignKey: 'board_id'});
    BoardModelSource.belongsTo(models.BoardSource, {foreignKey: 'source_id'});
  };
  return BoardModelSource;
};
