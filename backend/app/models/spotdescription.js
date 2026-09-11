'use strict';

/*
 * Append only. Nothing updates or deletes a row here - a correction is another
 * row. The current text lives on surfline_spots.notes and is written in the
 * same transaction as the revision, by one service.
 */
module.exports = (sequelize, DataTypes) => {
  const SpotDescription = sequelize.define('SpotDescription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    spot_id: DataTypes.STRING,
    body: DataTypes.TEXT,
    source: DataTypes.ENUM('generated', 'user', 'admin'),
    user_id: DataTypes.INTEGER,
  }, {
    underscored: true,
    tableName: 'spot_descriptions',
    // There is no updated_at column: a row never changes after it is written.
    updatedAt: false,
  });

  SpotDescription.associate = function(models) {
    SpotDescription.belongsTo(models.SurflineSpot, {foreignKey: 'spot_id'});
    SpotDescription.belongsTo(models.User, {foreignKey: 'user_id'});
  };

  return SpotDescription;
};
