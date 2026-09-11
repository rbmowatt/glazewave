'use strict';

/*
 * A locality for a spot. The atlas has never had one: `county` and `state_id`
 * are columns on this table already and are populated on none of the 1,611
 * seeded rows, so `crumbs` - "United States, New Jersey" - is the finest thing
 * a spot name can currently be qualified by.
 *
 * Deliberately NOT reusing `county`. It is an existing column with an existing
 * meaning, and overloading it would leave nobody able to tell an empty seed
 * value from a backfill that has not been run. `locality_source` is what makes
 * the difference readable: 'nominatim' for the reverse-geocoded batch, 'google'
 * for a contributed spot the picker resolved, NULL for never attempted.
 *
 * Nullable and staying nullable. A surf spot is frequently offshore or on an
 * unnamed stretch of sand where no locality exists to find, and the UI already
 * falls back to the region when this is absent.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('surfline_spots', 'city', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
    await queryInterface.addColumn('surfline_spots', 'locality_source', {
      type: Sequelize.STRING(40),
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('surfline_spots', 'locality_source');
    await queryInterface.removeColumn('surfline_spots', 'city');
  },
};
