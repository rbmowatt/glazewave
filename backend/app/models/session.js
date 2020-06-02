'use strict';
module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    title: DataTypes.STRING,
    rating: DataTypes.INTEGER,
    is_public: DataTypes.BOOLEAN,
    board_id: {
      type: DataTypes.INTEGER,
    },
    location_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER
  }, {underscored: true});
  Session.associate = function(models) {
    Session.belongsTo(models.UserBoard,  {foreignKey: 'board_id', targetKey: 'id'});
    Session.belongsTo(models.Location);
    Session.hasMany(models.SessionImage);
  };
  return Session;
};