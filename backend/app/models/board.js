'use strict';
module.exports = (sequelize, DataTypes) => {
  const Board = sequelize.define('Board', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    manufacturer_id: DataTypes.INTEGER,
    model: DataTypes.STRING,
    isPublic: DataTypes.BOOLEAN,
    createdBy: DataTypes.INTEGER
  }, {underscored: true});
  Board.associate = function(models) {
    // associations can be defined here
    Board.belongsTo(models.Manufacturer);
  };
  return Board;
};