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
    // VARCHAR, not an integer: locations.id holds either a Google place id or a
    // surfline_spots key, whichever the session form wrote. See
    // LocationService.resolve.
    location_id: DataTypes.STRING,
    is_public: DataTypes.BOOLEAN,
    is_default: DataTypes.BOOLEAN,
  },  {underscored: true, tableName: 'location_images'});
  LocationImage.associate = function(models) {
    LocationImage.belongsTo(models.Location, {foreignKey: 'location_id'});
  };
  return LocationImage;
};
