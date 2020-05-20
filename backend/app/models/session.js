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
    board_id: DataTypes.INTEGER,
    location_id: DataTypes.INTEGER,
    created_by: DataTypes.INTEGER
  }, {underscored: true});
  Session.associate = function(models) {
    Session.belongsTo(models.Board);
    Session.belongsTo(models.Location);
  };
  return Session;
};