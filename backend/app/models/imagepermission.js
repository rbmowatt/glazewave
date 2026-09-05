'use strict';
module.exports = (sequelize, DataTypes) => {
  const ImagePermission = sequelize.define('ImagePermission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    manufacturer_id: DataTypes.INTEGER,
    source_id: DataTypes.INTEGER,
    granted_by: DataTypes.STRING,
    granted_at: DataTypes.DATEONLY,
    expires_at: DataTypes.DATEONLY,
    scope: DataTypes.ENUM('catalog', 'editorial', 'any'),
    evidence_url: DataTypes.STRING,
    evidence_note: DataTypes.TEXT,
  }, {underscored: true, tableName: 'image_permissions'});
  ImagePermission.associate = function(models) {
    ImagePermission.belongsTo(models.Manufacturer);
    ImagePermission.belongsTo(models.BoardSource, {foreignKey: 'source_id'});
    ImagePermission.hasMany(models.BoardImage, {foreignKey: 'permission_id'});
  };
  return ImagePermission;
};
