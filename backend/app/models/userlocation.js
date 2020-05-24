'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserLocation = sequelize.define('UserLocation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    rating: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    location_id: DataTypes.INTEGER,
    notes: DataTypes.TEXT
  }, {underscored: true, tableName: 'user_locations'});
  UserLocation.associate = function(models) {
    UserLocation.belongsTo(models.Location);
    UserLocation.belongsTo(models.User);
  };
  return UserLocation;
};