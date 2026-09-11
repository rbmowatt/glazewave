'use strict';

module.exports = (sequelize, DataTypes) => {
  const SpotNote = sequelize.define('SpotNote', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    spot_id: DataTypes.STRING,
    user_id: DataTypes.INTEGER,
    // NULL is a top-level note. One level only, enforced in the service that
    // writes these - the table can hold a shape the page cannot render.
    parent_id: DataTypes.INTEGER,
    body: DataTypes.TEXT,
    is_hidden: DataTypes.BOOLEAN,
  }, {
    underscored: true,
    tableName: 'spot_notes',
    /*
     * QueryParser turns ?with[]=SpotNote into a generic include, so anything
     * this model hands back is reachable from whatever route the association
     * hangs off. A hidden note is hidden everywhere, including there.
     */
    defaultScope: {
      where: { is_hidden: false },
    },
    scopes: {
      // Everything, hidden rows included. For moderation, never for a response.
      moderation: {},
    },
  });

  SpotNote.associate = function(models) {
    SpotNote.belongsTo(models.SurflineSpot, {foreignKey: 'spot_id'});
    SpotNote.belongsTo(models.User, {foreignKey: 'user_id'});
    SpotNote.belongsTo(models.SpotNote, {as: 'parent', foreignKey: 'parent_id'});
    SpotNote.hasMany(models.SpotNote, {as: 'replies', foreignKey: 'parent_id'});
  };

  return SpotNote;
};
