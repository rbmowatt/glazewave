'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    username: DataTypes.STRING,
    profile_img: DataTypes.STRING,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN,
    type_id: DataTypes.INTEGER,
    last_login: DataTypes.DATE
  }, {underscored: true});
  User.associate = function(models) {
    User.hasMany(models.UserBoard);
    User.hasMany(models.Session);
    User.hasMany(models.UserLocation);

  };
  return User;
};