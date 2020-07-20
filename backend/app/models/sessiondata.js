'use strict';
module.exports = (sequelize, DataTypes) => {
  const SessionData = sequelize.define('SessionData', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
    session_id: DataTypes.INTEGER,
    water_temperature: DataTypes.STRING,
    swell_height: DataTypes.STRING,
    swell_period: DataTypes.STRING,
    wave_height: DataTypes.STRING,
    wave_period: DataTypes.STRING,
    pressure: DataTypes.STRING,
    wind_speed: DataTypes.STRING,
    lat: DataTypes.STRING,
    lon: DataTypes.STRING,
    created_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: new Date()
    },
    updated_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: new Date()
    }

  },  {underscored: true, tableName: 'session_data'});;
  SessionData.associate = function(models) {
    SessionData.belongsTo(models.Session);
  };
  return SessionData;
};