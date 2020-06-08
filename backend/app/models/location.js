'use strict';
module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define('Location', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
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