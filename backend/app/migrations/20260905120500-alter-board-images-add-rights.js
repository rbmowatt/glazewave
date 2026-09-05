'use strict';

// is_public already exists on this table and is NOT what display_scope means.
// is_public is the contributor's intent; display_scope is the rights verdict.
// A publicly rendered image has to satisfy both:
//   WHERE is_public = 1 AND display_scope IN ('public','attributed')
//
// `name` is already the S3 object key for uploads, so a mirrored harvest image
// reuses it and a hotlinked one leaves it null and serves source_url.
//
// display_scope defaults to 'internal', so every pre-existing row is invisible
// until the rights backfill seeder runs. That backfill lives in a seeder rather
// than here because it needs image_licenses and board_sources to be populated,
// and those are seeded after all migrations.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = {
      source_id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        references: { model: 'board_sources', key: 'id' },
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
      source_url: { type: Sequelize.STRING(1000) },
      content_hash: { type: Sequelize.CHAR(64) },
      // Permission to display is not permission to copy. A brand may be happy
      // to be shown and unhappy to be rehosted.
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
      display_scope: {
        type: Sequelize.ENUM('public', 'attributed', 'internal', 'blocked'),
        allowNull: false,
        defaultValue: 'internal',
      },
      rights_verified_at: { type: Sequelize.DATE },
      rights_verified_by: { type: Sequelize.STRING(120) },
      rights_note: { type: Sequelize.TEXT },
      // Hotlinked rows rot silently: brand CDNs rotate URLs and the page just
      // shows a broken image.
      last_checked_at: { type: Sequelize.DATE },
      position: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    };

    for (const [name, spec] of Object.entries(columns)) {
      await queryInterface.addColumn('board_images', name, spec);
    }

    await queryInterface.addIndex('board_images', ['board_id', 'content_hash'], {
      name: 'uq_board_image_hash',
      unique: true,
    });
    await queryInterface.addIndex(
      'board_images',
      ['board_id', 'is_public', 'display_scope', 'position'],
      { name: 'ix_board_image_display' }
    );
    await queryInterface.addIndex('board_images', ['display_scope', 'rights_verified_at'], {
      name: 'ix_rights_staleness',
    });

  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('board_images', 'ix_rights_staleness');
    await queryInterface.removeIndex('board_images', 'ix_board_image_display');
    await queryInterface.removeIndex('board_images', 'uq_board_image_hash');
    for (const name of ['position', 'last_checked_at', 'rights_note', 'rights_verified_by',
      'rights_verified_at', 'display_scope', 'attribution_url', 'attribution_text',
      'author', 'height', 'width', 'storage', 'content_hash', 'source_url',
      'permission_id', 'license_id', 'source_id']) {
      await queryInterface.removeColumn('board_images', name);
    }
  },
};
