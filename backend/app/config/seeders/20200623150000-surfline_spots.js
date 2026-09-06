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

// Rows written before this seeder stamped a source. They belong to nobody, so
// nothing else will ever clear them and a reseed collides on their primary key
// forever - a NULL never matches an IN list. Swept here rather than by hand,
// so a box already in that state recovers on the next run.
const ownedWhere = (Sequelize) => ({
  [Sequelize.Op.or]: [
    { source: { [Sequelize.Op.in]: OWNED } },
    { source: null },
  ],
});

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('surfline_spots', ownedWhere(Sequelize));

    const [states] = await queryInterface.sequelize.query(
      'SELECT id, name FROM states'
    );
    const byName = new Map(states.map((s) => [s.name, s.id]));

    const now = new Date();
    // source first, so a row that carries its own wins. The seed file predates
    // the column and has no source key at all, and a row inserted without one
    // is what the sweep above exists to clean up.
    const rows = data.map((row) => Object.assign({source: 'osm'}, row, {
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

  down: (queryInterface, Sequelize) =>
    queryInterface.bulkDelete('surfline_spots', ownedWhere(Sequelize)),
};
