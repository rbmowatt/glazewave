'use strict';

// Seeded inline rather than from data/: these rows are referenced by code
// (DisplayScope, the loader, the board_images backfill), so they are part of
// the schema rather than content.
const now = new Date();

const licenses = [
  ['user-contributed', 'User contributed under site terms', null, false, true, true, true, false, null],
  ['own-work', 'Own work', null, false, true, true, true, false, null],
  ['public-domain', 'Public domain', 'https://en.wikipedia.org/wiki/Public_domain', false, true, true, true, false, null],
  ['CC0', 'Creative Commons Zero', 'https://creativecommons.org/publicdomain/zero/1.0/', false, true, true, true, false, null],
  ['CC-BY-4.0', 'Creative Commons Attribution 4.0', 'https://creativecommons.org/licenses/by/4.0/', true, true, true, true, false, '{author}, {license}, via {source}'],
  // Share-alike can attach to a derivative, so these must not be composited
  // into a generated image.
  ['CC-BY-SA-3.0', 'Creative Commons Attribution-ShareAlike 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/', true, true, true, true, false, '{author}, {license}, via {source}'],
  // allows_redistribution stays false until a specific grant says otherwise:
  // permission to show is not permission to rehost.
  ['brand-permission', 'Granted by the manufacturer', null, true, true, false, true, true, 'Image courtesy of {author}'],
  ['subscriber-content', 'Paid subscriber content, storage only', null, false, false, false, false, false, null],
  ['rights-reserved', 'All rights reserved by a third party', null, false, false, false, false, false, null],
  ['unknown', 'Unclassified', null, true, false, false, false, false, null],
];

module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert('image_licenses', licenses.map((row) => ({
      code: row[0],
      name: row[1],
      url: row[2],
      requires_attribution: row[3],
      allows_public_display: row[4],
      allows_redistribution: row[5],
      allows_commercial: row[6],
      needs_grant: row[7],
      attribution_template: row[8],
      created_at: now,
      updated_at: now,
    })), {});
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete('image_licenses', null, {});
  },
};
