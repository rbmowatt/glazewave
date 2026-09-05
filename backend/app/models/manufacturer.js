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
    slug: DataTypes.STRING,
    // Every spelling a feed uses for this maker: "Pyzel", "Pyzel Surfboards",
    // "PYZEL". The loader resolves through here before creating a new row.
    aliases: DataTypes.JSON,
    website: DataTypes.STRING,
  }, {underscored: true});
  Manufacturer.associate = function(models) {
    Manufacturer.hasMany(models.Board)
    Manufacturer.hasMany(models.ImagePermission)
  };
  return Manufacturer;
};
