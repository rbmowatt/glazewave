'use strict';
module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define('Location', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    isPublic: DataTypes.BOOLEAN,
    cityId: DataTypes.INTEGER,
    created_by: DataTypes.INTEGER
  }, {underscored: true});
  Location.associate = function(models) {
    Location.belongsTo(models.City);
  };
  return Location;
};