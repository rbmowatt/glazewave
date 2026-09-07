'use strict';
const DisplayScope = require('./../services/rights/DisplayScope');

module.exports = (sequelize, DataTypes) => {
  const SpotImage = sequelize.define('SpotImage', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
    // The S3 key prefix, "spot-images/<sha256>/". SpotImageService appends the
    // width, so one row serves 400, 800 and 1600.
    spot_id: DataTypes.STRING,
    name: DataTypes.STRING,
    source_id: DataTypes.INTEGER,
    license_id: DataTypes.INTEGER,
    permission_id: DataTypes.INTEGER,
    source_url: DataTypes.STRING,
    content_hash: DataTypes.CHAR(64),
    storage: DataTypes.ENUM('none', 'hotlink', 'mirrored'),
    width: DataTypes.INTEGER,
    height: DataTypes.INTEGER,
    author: DataTypes.STRING,
    attribution_text: DataTypes.STRING,
    attribution_url: DataTypes.STRING,
    // What the photograph is of, decided by eye. 'context' means the coast is
    // the setting and something else is the subject - a pier, a lighthouse, a
    // beach town from the air. Still shippable, still not the break.
    subject: DataTypes.ENUM('coastal', 'context'),
    is_public: DataTypes.BOOLEAN,
    is_default: DataTypes.BOOLEAN,
    // Derived by DisplayScope, never assigned by a caller.
    display_scope: DataTypes.ENUM('public', 'attributed', 'internal', 'blocked'),
    position: DataTypes.INTEGER,
    distance_m: DataTypes.INTEGER,
    relevance_score: DataTypes.DECIMAL(4, 1),
    rights_verified_at: DataTypes.DATE,
    rights_verified_by: DataTypes.STRING,
    rights_note: DataTypes.TEXT,
    last_checked_at: DataTypes.DATE,
  },  {
    underscored: true,
    tableName: 'spot_images',
    // QueryParser turns ?with[]=SpotImage into a generic include, so anything
    // this model hands back is reachable from an unauthenticated URL - and
    // /api/spot/nearest and /search are both open by design. The default scope
    // is what stops that being a way around the rights gate: non-renderable
    // rows never load, and neither do the columns that could be turned into an
    // <img src>. Rendering goes through SpotImageService, which is the only
    // path that also carries the credit line the licence requires.
    defaultScope: {
      where: {
        is_public: true,
        display_scope: ['public', 'attributed'],
      },
      attributes: {
        exclude: ['source_url', 'name', 'rights_note', 'content_hash', 'permission_id'],
      },
    },
    scopes: {
      // Everything, unfiltered. For server-side rights work and admin views,
      // never for a response body.
      rights: {},
    },
  });

  // Instance hooks do not fire on bulkCreate without individualHooks, and the
  // loader writes in bulk. DisplayScope.reconcile is what catches those, and
  // the loader is required to run it and fail on any row it returns.
  SpotImage.addHook('beforeSave', async (image) => {
    await DisplayScope.applyTo(image, sequelize.models);
  });

  SpotImage.associate = function(models) {
    SpotImage.belongsTo(models.SurflineSpot, {foreignKey: 'spot_id'});
    SpotImage.belongsTo(models.ContentSource, {foreignKey: 'source_id'});
    SpotImage.belongsTo(models.ImageLicense, {foreignKey: 'license_id'});
    SpotImage.belongsTo(models.ImagePermission, {foreignKey: 'permission_id'});
  };

  // Everything rendered to a stranger goes through here. Both gates, always.
  SpotImage.publicScope = function() {
    return {
      where: {
        is_public: true,
        display_scope: ['public', 'attributed'],
      },
      order: [['position', 'ASC']],
    };
  };

  return SpotImage;
};
