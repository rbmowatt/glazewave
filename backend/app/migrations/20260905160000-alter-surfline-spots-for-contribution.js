'use strict';

// Makes surfline_spots a contributable table rather than a one-off import.
//
// Measured 5 Sep 2026: the only openly-licensed global spot data is OSM's 1,262
// sport=surfing objects (1,067 named) plus 37 Wikidata surf spots. That data is
// heavily Europe-weighted - 127 in SW France against 14 in southern California
// and 2 in all of New Jersey - so a seed alone cannot cover the world and
// coverage has to come from the people who surf each place.
//
// The id column is a STRING primary key left over from Surfline ids, which is
// useful here: it carries provenance without a join. Convention is
// <source>:<native id> - osm:node/1234, wd:Q7644300, user:<uuid>.
//
// break_type through hazards mirror the fields a surf atlas needs. Field names
// are not protected; the data behind them has to be OSM, Wikidata or
// contributed, never copied from a proprietary atlas.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = {
      source: { type: Sequelize.STRING(40) },
      created_by: { type: Sequelize.INTEGER(11).UNSIGNED },
      // Contributed spots are visible by default: a spot nobody else can see is
      // worse than no spot, because the next person adds a duplicate.
      is_public: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      break_type: { type: Sequelize.STRING(40) },
      wave_direction: { type: Sequelize.STRING(20) },
      bottom: { type: Sequelize.STRING(40) },
      difficulty: { type: Sequelize.STRING(40) },
      hazards: { type: Sequelize.STRING(255) },
      notes: { type: Sequelize.TEXT },
    };

    for (const [name, spec] of Object.entries(columns)) {
      await queryInterface.addColumn('surfline_spots', name, spec);
    }

    await queryInterface.addIndex('surfline_spots', ['source'], {
      name: 'ix_spot_source',
    });

    // Everything already in the table came from the parked Surfline import or
    // the Overpass beach seed. Marking it now means a later OSM refresh can
    // tell its own rows from a person's without guessing.
    await queryInterface.sequelize.query(
      `UPDATE surfline_spots SET source = 'legacy' WHERE source IS NULL`
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('surfline_spots', 'ix_spot_source');
    for (const name of ['notes', 'hazards', 'difficulty', 'bottom',
      'wave_direction', 'break_type', 'is_public', 'created_by', 'source']) {
      await queryInterface.removeColumn('surfline_spots', name);
    }
  },
};
