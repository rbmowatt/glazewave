'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserBoard = sequelize.define('UserBoard', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    size: DataTypes.STRING,
    rating: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    board_id: DataTypes.INTEGER,
    notes: DataTypes.TEXT,
    is_public: DataTypes.BOOLEAN
  }, {underscored: true, tableName: 'user_boards'});
  UserBoard.associate = function(models) {
    UserBoard.belongsTo(models.Board);
    UserBoard.belongsTo(models.User);
    UserBoard.hasMany(models.UserBoardImage);
  };
  return UserBoard;
};