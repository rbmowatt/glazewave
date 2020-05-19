'use strict';
module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      autoIncrement: true,
    },
    title: DataTypes.STRING,
    rating: DataTypes.INTEGER,
    isPublic: DataTypes.BOOLEAN,
    boardId: DataTypes.INTEGER,
    locationId: DataTypes.INTEGER,
    createdBy: DataTypes.INTEGER,
  }, {underscored: true});
  Session.associate = function(models) {
    Session.belongsTo(models.Board);
    Session.belongsTo(models.Location);
  };
  return Session;
};