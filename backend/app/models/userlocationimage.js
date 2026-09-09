'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserLocationImage = sequelize.define('UserLocationImage', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
    name: DataTypes.STRING,
    user_id: DataTypes.INTEGER,
    // The column is user_location_id and points at user_locations, not at
    // locations - a rider's own named spot, not the shared one.
    user_location_id: DataTypes.INTEGER,
    is_public: DataTypes.BOOLEAN,
    is_default: DataTypes.BOOLEAN,
    notes: DataTypes.TEXT
  },  {underscored: true, tableName: 'user_location_images'});
  UserLocationImage.associate = function(models) {
    UserLocationImage.belongsTo(models.User);
    UserLocationImage.belongsTo(models.UserLocation, {foreignKey: 'user_location_id'});
  };
  return UserLocationImage;
};
