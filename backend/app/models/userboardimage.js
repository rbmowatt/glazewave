'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserBoardImage = sequelize.define('UserBoardImage', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
    name: DataTypes.STRING,
    user_id: DataTypes.INTEGER,
    user_board_id: DataTypes.INTEGER,
    is_public: DataTypes.BOOLEAN,
    is_default: DataTypes.BOOLEAN,
    notes: DataTypes.TEXT
  },  {underscored: true, tableName: 'user_board_images'});;
  UserBoardImage.associate = function(models) {
    UserBoardImage.belongsTo(models.User);
    UserBoardImage.belongsTo(models.UserBoard);
  };
  return UserBoardImage;
};