'use strict';
module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define('Location', {
    // The column is VARCHAR and holds a Google place id, not an integer -
    // see migration 20200516162256-create-location. The model said INTEGER
    // autoIncrement, which is neither.
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: DataTypes.STRING,
    formatted_address: DataTypes.STRING,
    lat: DataTypes.STRING,
    lng: DataTypes.STRING,
    vicinity : DataTypes.STRING,
    url : DataTypes.STRING
  }, {underscored: true});
  Location.associate = function(models) {
    //Location.belongsTo(models.City);
  };
  return Location;
};