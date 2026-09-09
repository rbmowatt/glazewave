'use strict';
const cascade = require('./../services/elastic/Cascade')

module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define('Location', {
    // The column is VARCHAR and holds a Google place id, not an integer -
    // see migration 20200516162256-create-location. The model said INTEGER
    // autoIncrement, which is neither.
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: DataTypes.STRING,
    formatted_address: DataTypes.STRING,
    lat: DataTypes.STRING,
    lng: DataTypes.STRING,
    vicinity : DataTypes.STRING,
    url : DataTypes.STRING
  }, {underscored: true});
  /*
   * locations.name is the session document's `location`, which the dashboard's
   * distinct-spot count aggregates on, and lat/lng are its location_point.
   * Renaming a spot moved MySQL and left every session document quoting the
   * old name.
   */
  Location.addHook('afterUpdate', (location, options) =>
    cascade.changedAny(options, location, ['name', 'lat', 'lng'])
      ? cascade.locationChanged(location.id)
      : null
  )

  /*
   * Same trap as user_boards: sessions.location_id is ON DELETE SET NULL, so
   * the sessions have to be collected while the row still exists. Locations
   * are shared catalog rows and rarely deleted, but a delete that left every
   * session at that spot still naming it would be silent.
   */
  Location.addHook('beforeDestroy', async (location, options) => {
    options.cascadeSessionIds = await cascade.sessionsForLocation(location.id)
  })
  Location.addHook('afterDestroy', (location, options) =>
    cascade.queueSessions(options.cascadeSessionIds || [])
  )

  Location.associate = function(models) {
    //Location.belongsTo(models.City);
  };
  return Location;
};