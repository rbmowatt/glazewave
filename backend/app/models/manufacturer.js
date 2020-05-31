'use strict';
module.exports = (sequelize, DataTypes) => {
  const Manufacturer = sequelize.define('Manufacturer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
  }, {underscored: true});
  Manufacturer.associate = function(models) {
    Manufacturer.hasMany(models.Board)
  };
  return Manufacturer;
};