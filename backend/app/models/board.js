'use strict';
module.exports = (sequelize, DataTypes) => {
  const Board = sequelize.define('Board', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: true,
    },
    manufacturer: DataTypes.STRING,
    model: DataTypes.STRING,
    isPublic: DataTypes.BOOLEAN,
    createdBy: DataTypes.INTEGER
  }, {underscored: true});
  Board.associate = function(models) {
    // associations can be defined here
  };
  return Board;
};