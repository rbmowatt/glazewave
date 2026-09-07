'use strict';

// board_sources was named when only boards had provenance. Spot photos come
// from Wikimedia the same way board photos do, and the `wikimedia` row this
// table already holds is the one both use — so the table outgrew its name
// rather than needing a sibling.
//
// MySQL carries foreign keys through a rename, so board_images.source_id,
// board_model_sources.source_id and image_permissions.source_id keep pointing
// here. Their constraint names still read board_sources_ibfk_*; that is
// cosmetic and renaming a constraint means dropping and re-adding it.
//
// The seeders that populate this table were updated to the new name in the same
// change. They have no seederStorage, so they are re-runnable by hand and a
// stale one would have inserted into a table that no longer exists.
module.exports = {
  up: (queryInterface) => queryInterface.renameTable('board_sources', 'content_sources'),

  down: (queryInterface) => queryInterface.renameTable('content_sources', 'board_sources'),
};
