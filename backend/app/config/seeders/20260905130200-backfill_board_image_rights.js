'use strict';

// Runs after the license and source seeders, which is the whole reason it is a
// seeder: the alter migration cannot reference rows that do not exist yet.
//
// Every board_images row predating the rights columns is a user upload, and
// display_scope defaults to 'internal', so without this every board photo on
// the site is invisible. Currently a no-op against two test boards.
module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.query(`
      UPDATE board_images bi
        JOIN image_licenses l ON l.code = 'user-contributed'
        JOIN board_sources s ON s.source_key = 'user'
         SET bi.license_id = l.id,
             bi.source_id = s.id,
             bi.display_scope = 'public',
             bi.storage = 'mirrored',
             bi.rights_verified_at = NOW(),
             bi.rights_verified_by = 'seeder-backfill'
       WHERE bi.license_id IS NULL
    `);
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.query(`
      UPDATE board_images
         SET license_id = NULL,
             source_id = NULL,
             display_scope = 'internal',
             rights_verified_at = NULL,
             rights_verified_by = NULL
       WHERE rights_verified_by = 'seeder-backfill'
    `);
  },
};
