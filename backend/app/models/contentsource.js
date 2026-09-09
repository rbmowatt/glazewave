'use strict';
module.exports = (sequelize, DataTypes) => {
  const ContentSource = sequelize.define('ContentSource', {
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
  }, {underscored: true, tableName: 'content_sources'});
  ContentSource.associate = function(models) {
    ContentSource.belongsTo(models.ImageLicense, {as: 'defaultLicense', foreignKey: 'default_license_id'});
    ContentSource.hasMany(models.BoardModelSource, {foreignKey: 'source_id'});
    ContentSource.hasMany(models.BoardImage, {foreignKey: 'source_id'});
    ContentSource.hasMany(models.SpotImage, {foreignKey: 'source_id'});
  };
  return ContentSource;
};
