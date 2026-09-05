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
    // Populated with the pair reversed by the parked Surfline import and read
    // by nothing. Fix the import before anything starts using it.
    geo: DataTypes.GEOMETRY,
    url: DataTypes.STRING,
    // osm | wikidata | user | legacy. Matches the <source>: prefix on the id.
    source: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    is_public: DataTypes.BOOLEAN,
    break_type: DataTypes.STRING,
    wave_direction: DataTypes.STRING,
    bottom: DataTypes.STRING,
    difficulty: DataTypes.STRING,
    hazards: DataTypes.STRING,
    notes: DataTypes.TEXT,
  }, {underscored: true, tableName: 'surfline_spots'});
  SurflineSpot.associate = function(models) {
    // associations can be defined here
  };
  return SurflineSpot;
};