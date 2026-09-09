'use strict';

// The Creative Commons versions the spot harvest actually turned up. The first
// licence seeder covers CC0, public domain, CC BY 4.0 and CC BY-SA 3.0; the
// 3,162 spot photos span thirteen, and a licence with no row is a row the
// loader refuses to write.
//
// CC-BY-SA-3.0-DE has no image in the current set - it was on a file the visual
// review rejected - and is seeded anyway, because a re-harvest that finds one
// should not fail on a missing row.
//
// Every one of these is a free licence: public display, redistribution and
// commercial use are all permitted, and every one requires attribution. The
// ShareAlike ones additionally bind derivatives, which is not a column here -
// DisplayScope reads it off the code, and the frontend filters on it before
// compositing anything.
//
// Inserted by difference rather than wholesale: the box has already run the
// first seeder, and there is no seederStorage, so this has to be safe to run
// twice.
const now = new Date();

const licenses = [
  ['CC-BY-2.0', 'Creative Commons Attribution 2.0', 'https://creativecommons.org/licenses/by/2.0/'],
  ['CC-BY-2.5', 'Creative Commons Attribution 2.5', 'https://creativecommons.org/licenses/by/2.5/'],
  ['CC-BY-3.0', 'Creative Commons Attribution 3.0', 'https://creativecommons.org/licenses/by/3.0/'],
  ['CC-BY-3.0-US', 'Creative Commons Attribution 3.0 United States', 'https://creativecommons.org/licenses/by/3.0/us/'],
  ['CC-BY-3.0-PL', 'Creative Commons Attribution 3.0 Poland', 'https://creativecommons.org/licenses/by/3.0/pl/'],
  ['CC-BY-3.0-CL', 'Creative Commons Attribution 3.0 Chile', 'https://creativecommons.org/licenses/by/3.0/cl/'],
  ['CC-BY-SA-2.0', 'Creative Commons Attribution-ShareAlike 2.0', 'https://creativecommons.org/licenses/by-sa/2.0/'],
  ['CC-BY-SA-2.5', 'Creative Commons Attribution-ShareAlike 2.5', 'https://creativecommons.org/licenses/by-sa/2.5/'],
  ['CC-BY-SA-4.0', 'Creative Commons Attribution-ShareAlike 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'],
  ['CC-BY-SA-3.0-DE', 'Creative Commons Attribution-ShareAlike 3.0 Germany', 'https://creativecommons.org/licenses/by-sa/3.0/de/'],
];

module.exports = {
  up: async (queryInterface) => {
    const [existing] = await queryInterface.sequelize.query(
      'SELECT code FROM image_licenses'
    );
    const have = new Set(existing.map((r) => r.code));
    const rows = licenses
      .filter((row) => !have.has(row[0]))
      .map((row) => ({
        code: row[0],
        name: row[1],
        url: row[2],
        requires_attribution: true,
        allows_public_display: true,
        allows_redistribution: true,
        allows_commercial: true,
        needs_grant: false,
        attribution_template: '{author}, {license}, via {source}',
        created_at: now,
        updated_at: now,
      }));

    if (!rows.length) return null;
    return queryInterface.bulkInsert('image_licenses', rows, {});
  },

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('image_licenses', {
    code: { [Sequelize.Op.in]: licenses.map((row) => row[0]) },
  }, {}),
};
