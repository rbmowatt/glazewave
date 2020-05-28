'use strict';
module.exports = (sequelize, DataTypes) => {
  const BoardImage = sequelize.define('BoardImage', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
    name: DataTypes.STRING,
    user_id: DataTypes.INTEGER,
    board_id: DataTypes.INTEGER,
    is_public: DataTypes.BOOLEAN,
    is_default: DataTypes.BOOLEAN,
  },  {underscored: true, tableName: 'board_images'});;
  BoardImage.associate = function(models) {
    BoardImage.belongsTo(models.Board);
  };
  return BoardImage;
};