'use strict';
module.exports = (sequelize, DataTypes) => {
  const LocationImage = sequelize.define('LocationImage', {
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
  LocationImage.associate = function(models) {
    LocationImage.belongsTo(models.Location);
  };
  return LocationImage;
};