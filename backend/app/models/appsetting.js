'use strict';

module.exports = (sequelize, DataTypes) => {
  const AppSetting = sequelize.define('AppSetting', {
    // setting_key, not `key` - KEY is reserved in MySQL 8 and any raw query
    // against it would need backticks to parse.
    setting_key: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false,
    },
    value: DataTypes.STRING(255),
    updated_by: DataTypes.INTEGER,
  }, {underscored: true, tableName: 'app_settings'});

  AppSetting.associate = function(models) {
    AppSetting.belongsTo(models.User, {foreignKey: 'updated_by'});
  };

  return AppSetting;
};
