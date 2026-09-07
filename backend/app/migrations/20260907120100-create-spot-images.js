'use strict';

// Photos of surf spots, carrying the same rights columns board_images grew by
// ALTER. They are here from the start because an image table whose rights
// columns are nullable afterthoughts is how you end up with rows nobody can
// prove the licence of.
//
// display_scope defaults to 'internal' — invisible — so a row that never
// reaches DisplayScope.applyTo fails closed rather than rendering uncredited.
// The loader writes the derived value and then runs DisplayScope.reconcile;
// bulkCreate skips instance hooks, which is exactly how a harvest writes.
//
// subject records what the photograph is OF, decided by looking at all 3,033
// distinct files. It has no 'not' member on purpose: those were pruned from the
// set, and a value the loader can never write is a value someone eventually
// writes by hand.
//
// position and is_default look redundant while only the top image per spot
// loads. They are what makes loading ranks 2 and 3 later a re-run instead of
// another migration.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('spot_images', {
      id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      // VARCHAR(191), not 255: this plus content_hash is a unique index, and
      // utf8mb4 puts 255 over the InnoDB key length limit.
      spot_id: {
        type: Sequelize.STRING(191),
        allowNull: false,
        references: { model: 'surfline_spots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      source_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        references: { model: 'content_sources', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      license_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        references: { model: 'image_licenses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      permission_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        references: { model: 'image_permissions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // The S3 key prefix, "spot-images/<sha256>/". The service appends the
      // width, because one stored object serves 400, 800 and 1600.
      name: { type: Sequelize.STRING(255) },
      // The Commons file page, which is where the licence can be checked. Not
      // the image URL: Wikimedia asks that upload.wikimedia.org not be
      // hotlinked, which is why the bytes are mirrored.
      source_url: { type: Sequelize.STRING(1000) },
      content_hash: { type: Sequelize.CHAR(64) },
      storage: {
        type: Sequelize.ENUM('none', 'hotlink', 'mirrored'),
        allowNull: false,
        defaultValue: 'mirrored',
      },
      width: { type: Sequelize.SMALLINT.UNSIGNED },
      height: { type: Sequelize.SMALLINT.UNSIGNED },
      author: { type: Sequelize.STRING(255) },
      attribution_text: { type: Sequelize.STRING(500) },
      attribution_url: { type: Sequelize.STRING(500) },
      subject: {
        type: Sequelize.ENUM('coastal', 'context'),
        allowNull: false,
        defaultValue: 'coastal',
      },
      display_scope: {
        type: Sequelize.ENUM('public', 'attributed', 'internal', 'blocked'),
        allowNull: false,
        defaultValue: 'internal',
      },
      is_public: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      position: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
      // Metres from the spot's coordinates to where the photo was taken, when
      // Commons had a geotag. Kept because it is what a re-review sorts on, and
      // recomputing it means re-querying Commons.
      distance_m: { type: Sequelize.MEDIUMINT.UNSIGNED },
      relevance_score: { type: Sequelize.DECIMAL(4, 1) },
      rights_verified_at: { type: Sequelize.DATE },
      rights_verified_by: { type: Sequelize.STRING(120) },
      rights_note: { type: Sequelize.TEXT },
      last_checked_at: { type: Sequelize.DATE },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // One photograph can be the best match for a dozen adjacent OSM nodes on
    // the same beach, so the hash is unique per spot, never globally.
    await queryInterface.addIndex('spot_images', ['spot_id', 'content_hash'], {
      name: 'uq_spot_image_hash',
      unique: true,
    });
    await queryInterface.addIndex(
      'spot_images',
      ['spot_id', 'is_public', 'display_scope', 'position'],
      { name: 'ix_spot_image_display' }
    );
    // What the nearest/search endpoints hit: the default image for a batch of
    // spot ids, in one query rather than one per row.
    await queryInterface.addIndex(
      'spot_images',
      ['is_default', 'display_scope', 'spot_id'],
      { name: 'ix_spot_image_default' }
    );
    await queryInterface.addIndex('spot_images', ['display_scope', 'rights_verified_at'], {
      name: 'ix_spot_rights_staleness',
    });
  },

  down: (queryInterface) => queryInterface.dropTable('spot_images'),
};
