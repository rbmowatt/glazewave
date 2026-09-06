'use strict';
const data = require('../../../data/surfline_spots.json');

// state_id is resolved here rather than baked into the JSON: states.id is
// auto-increment, so an id captured on one database is wrong on the next one
// seeded in a different order. The build script leaves it null and writes the
// state name into crumbs as "<country>, <state>".
//
// Mexican states have no row in states, so those spots keep a null FK and are
// found by crumbs alone.
const CHUNK = 500;

// Rows this seeder owns. sequelize-cli has no seederStorage configured, so a
// seed can be run again at any time; clearing these first makes a reseed an
// update rather than a primary key collision. Contributed spots are source
// 'user' and are never touched.
const OWNED = ['legacy', 'osm'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('surfline_spots', {
      source: { [Sequelize.Op.in]: OWNED },
    });

    const [states] = await queryInterface.sequelize.query(
      'SELECT id, name FROM states'
    );
    const byName = new Map(states.map((s) => [s.name, s.id]));

    const now = new Date();
    const rows = data.map((row) => Object.assign({}, row, {
      state_id: byName.get(String(row.crumbs || '').split(', ').pop()) || null,
      created_at: now,
      updated_at: now,
    }));

    // Chunked because the seed is thousands of rows and one insert of that size
    // trips max_allowed_packet on a default MySQL config.
    for (let i = 0; i < rows.length; i += CHUNK) {
      await queryInterface.bulkInsert('surfline_spots', rows.slice(i, i + CHUNK), {});
    }
  },

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('surfline_spots', {
    source: { [Sequelize.Op.in]: OWNED },
  }),
};
