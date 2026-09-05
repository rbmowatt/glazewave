'use strict';
const DisplayScope = require('./../services/rights/DisplayScope');

module.exports = (sequelize, DataTypes) => {
  const BoardImage = sequelize.define('BoardImage', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
    // The S3 object key when storage is 'mirrored'. Null for a hotlink, which
    // serves source_url instead.
    name: DataTypes.STRING,
    user_id: DataTypes.INTEGER,
    board_id: DataTypes.INTEGER,
    // The contributor's own choice. Not a rights decision: a public listing
    // still has to clear display_scope.
    is_public: DataTypes.BOOLEAN,
    is_default: DataTypes.BOOLEAN,
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
    // Derived by DisplayScope, never assigned by a caller.
    display_scope: DataTypes.ENUM('public', 'attributed', 'internal', 'blocked'),
    rights_verified_at: DataTypes.DATE,
    rights_verified_by: DataTypes.STRING,
    rights_note: DataTypes.TEXT,
    last_checked_at: DataTypes.DATE,
    position: DataTypes.INTEGER,
  },  {underscored: true, tableName: 'board_images'});;

  // Instance hooks do not fire on bulkCreate without individualHooks, and a
  // harvest writes in bulk. DisplayScope.reconcile is what catches those.
  BoardImage.addHook('beforeSave', async (image) => {
    await DisplayScope.applyTo(image, sequelize.models);
  });

  BoardImage.associate = function(models) {
    BoardImage.belongsTo(models.Board);
    BoardImage.belongsTo(models.BoardSource, {foreignKey: 'source_id'});
    BoardImage.belongsTo(models.ImageLicense, {foreignKey: 'license_id'});
    BoardImage.belongsTo(models.ImagePermission, {foreignKey: 'permission_id'});
  };

  // Everything rendered to a stranger goes through here. Both gates, always.
  BoardImage.publicScope = function() {
    return {
      where: {
        is_public: true,
        display_scope: ['public', 'attributed'],
      },
      order: [['position', 'ASC']],
    };
  };

  return BoardImage;
};
