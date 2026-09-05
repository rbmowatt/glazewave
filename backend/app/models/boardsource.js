'use strict';
module.exports = (sequelize, DataTypes) => {
  const BoardSource = sequelize.define('BoardSource', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    source_key: DataTypes.STRING,
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    terms_url: DataTypes.STRING,
    // Governs text reuse, not images. False for EOS: the facts it supplies are
    // publishable, the prose is not.
    redistributable: DataTypes.BOOLEAN,
    default_license_id: DataTypes.INTEGER,
    notes: DataTypes.TEXT,
  }, {underscored: true, tableName: 'board_sources'});
  BoardSource.associate = function(models) {
    BoardSource.belongsTo(models.ImageLicense, {as: 'defaultLicense', foreignKey: 'default_license_id'});
    BoardSource.hasMany(models.BoardModelSource, {foreignKey: 'source_id'});
    BoardSource.hasMany(models.BoardImage, {foreignKey: 'source_id'});
  };
  return BoardSource;
};
