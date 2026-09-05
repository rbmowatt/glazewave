'use strict';
const {getSessionQueue} = require('./../services/queue/BetterQueue')

/*
 * The elasticsearch projection joins session_data, but only Session carried
 * index hooks - so a conditions row written after the session was created had
 * nothing to reindex it. It only ever landed because the queue's 5s batch
 * delay outlasted the second write, which is timing, not a guarantee.
 */
const reindexSession = async (sessionData, options) => {
  if (!sessionData.session_id) return;
  getSessionQueue().push({id: sessionData.session_id})
    .on('finish', function (result) {
    })
    .on('failed', function (err) {
    })
}

module.exports = (sequelize, DataTypes) => {
  const SessionData = sequelize.define('SessionData', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
    session_id: DataTypes.INTEGER,
    water_temperature: DataTypes.DOUBLE,
    swell_height: DataTypes.DOUBLE,
    swell_period: DataTypes.DOUBLE,
    wave_height: DataTypes.DOUBLE,
    wave_period: DataTypes.DOUBLE,
    pressure: DataTypes.DOUBLE,
    wind_speed: DataTypes.DOUBLE,
    // Which of the seven the user set by hand. The resolver skips these, so a
    // corrected reading survives a later change of date or spot while the rest
    // move with it.
    manual_fields: DataTypes.JSON,
    // Non-null with a null value means open-meteo had nothing for that point:
    // a grid cell on shore returns nulls for every field. Distinguishes that
    // from a row written before conditions were ever resolved.
    resolved_at: DataTypes.DATE,
    // The UTC hour actually pulled. The hourly response is indexed against
    // whatever timezone the request asked for, so anything else stored here
    // makes the value unreproducible.
    resolved_for: DataTypes.DATE,
    // The grid point open-meteo resolved to, which is the nearest seeded spot
    // rather than the Google place on the session.
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
  SessionData.addHook('afterCreate', reindexSession)
  SessionData.addHook('afterUpdate', reindexSession)
  SessionData.associate = function(models) {
    SessionData.belongsTo(models.Session);
  };
  return SessionData;
};
