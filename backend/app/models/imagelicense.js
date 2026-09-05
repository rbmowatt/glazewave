'use strict';
module.exports = (sequelize, DataTypes) => {
  const ImageLicense = sequelize.define('ImageLicense', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    code: DataTypes.STRING,
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    requires_attribution: DataTypes.BOOLEAN,
    allows_public_display: DataTypes.BOOLEAN,
    allows_redistribution: DataTypes.BOOLEAN,
    allows_commercial: DataTypes.BOOLEAN,
    needs_grant: DataTypes.BOOLEAN,
    attribution_template: DataTypes.STRING,
  }, {underscored: true, tableName: 'image_licenses'});
  ImageLicense.associate = function(models) {
    ImageLicense.hasMany(models.BoardImage, {foreignKey: 'license_id'});
    ImageLicense.hasMany(models.BoardSource, {foreignKey: 'default_license_id'});
  };
  return ImageLicense;
};
