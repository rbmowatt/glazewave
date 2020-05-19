'use strict';
module.exports = (sequelize, DataTypes) => {
  const City = sequelize.define('City', {
    id: DataTypes.INTEGER,
    name: DataTypes.STRING,
  }, {});
  City.associate = function(models) {
    // associations can be defined here
  };
  return City;
};