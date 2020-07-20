'use strict';
module.exports = (sequelize, DataTypes) => {
  const SessionImage = sequelize.define('SessionImage', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
    name: DataTypes.STRING,
    user_id: DataTypes.INTEGER,
    session_id: DataTypes.INTEGER,
    is_public: DataTypes.BOOLEAN,
    is_default: DataTypes.BOOLEAN,
    notes: DataTypes.TEXT
  },  {underscored: true, tableName: 'session_images'});;
  SessionImage.associate = function(models) {
    SessionImage.belongsTo(models.User);
    SessionImage.belongsTo(models.Session);
  };
  SessionImage.addScope('session_public'),
  {
    include: [
      { model: 'sessions' , where: { is_public : true } }
    ]
  }
  return SessionImage;
};