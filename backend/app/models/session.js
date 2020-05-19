'use strict';
module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    title: DataTypes.STRING,
    rating: DataTypes.INTEGER,
    isPublic: DataTypes.BOOLEAN,
    createdBy: DataTypes.INTEGER
  }, {});
  Session.associate = function(models) {
    // associations can be defined here
  };
  return Session;
};