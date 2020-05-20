'use strict';
module.exports = (sequelize, DataTypes) => {
  const Manufacturer = sequelize.define('Manufacturer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
  }, {underscored: true});
  Manufacturer.associate = function(models) {
    // associations can be defined here
  };
  return Manufacturer;
};