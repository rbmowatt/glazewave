'use strict';
module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define('Location', {
    id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    : DataTypes.STRING,
    isPublic: DataTypes.BOOLEAN,
    createdBy: DataTypes.INTEGER
  }, {});
  Location.associate = function(models) {
    // associations can be defined here
  };
  return Location;
};