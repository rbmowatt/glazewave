'use strict';
module.exports = (sequelize, DataTypes) => {
  const City = sequelize.define('City', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    stateId: DataTypes.INTEGER,
  }, {underscored: true});
  City.associate = function(models) {
    City.hasOne(models.State);
  };
  return City;
};