'use strict';
module.exports = (sequelize, DataTypes) => {
  const SurflineSpot = sequelize.define('SurflineSpot', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: DataTypes.STRING,
    crumbs: DataTypes.STRING,
    cams: DataTypes.STRING,
    state_id: DataTypes.INTEGER,
    county: DataTypes.STRING,
    lat: DataTypes.STRING,
    lon: DataTypes.STRING,
    geo: DataTypes.GEOMETRY,
    url: DataTypes.STRING
  }, {underscored: true, tableName: 'surfline_spots'});
  SurflineSpot.associate = function(models) {
    // associations can be defined here
  };
  return SurflineSpot;
};