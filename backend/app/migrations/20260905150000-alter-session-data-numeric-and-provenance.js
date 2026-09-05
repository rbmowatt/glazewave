'use strict';

/*
 * The seven condition columns were VARCHAR only because buildConditions
 * formatted with toFixed, which returns a string. Nothing chose text storage.
 *
 * session_data held zero rows when this ran, so there is no data pass here.
 * If it is ever rerun against a populated table, add one first: MySQL converts
 * '' to 0 with a warning rather than an error, which would make a real 0 kt
 * wind indistinguishable from a missing reading.
 *
 * elastic/indexes/sessions.json already maps all seven as float, so the index
 * needs no change - it has been coercing the strings all along.
 *
 * DOUBLE rather than DECIMAL: mysql2 hands DECIMAL back as a string to keep
 * precision, which would leave these exactly as unusable in JS as the VARCHAR
 * they replace. These are physical measurements at one or two decimals, not
 * money, so binary representation costs nothing and the column arrives as a
 * real number.
 */
const NUMERIC = [
  'wave_height',
  'swell_height',
  'wave_period',
  'swell_period',
  'water_temperature',
  'wind_speed',
  'pressure',
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const column of NUMERIC) {
      await queryInterface.changeColumn('session_data', column, {
        type: Sequelize.DOUBLE,
        allowNull: true,
      });
    }

    /*
     * Which of the seven the user set by hand. The resolver skips these, so a
     * corrected water temp survives a later change of date or spot while the
     * other six move. Per field, not per row.
     */
    await queryInterface.addColumn('session_data', 'manual_fields', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    /*
     * resolved_at non-null with a null value means open-meteo had nothing for
     * that point - a grid cell that landed on shore returns nulls for every
     * field. Without this there is no way to tell that from a session logged
     * before conditions were resolved at all.
     */
    await queryInterface.addColumn('session_data', 'resolved_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    /*
     * The UTC hour actually pulled, not the session's local time. The hourly
     * response is indexed against whatever timezone the request asked for, so
     * storing anything else makes the value unreproducible.
     */
    await queryInterface.addColumn('session_data', 'resolved_for', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('session_data', 'resolved_for');
    await queryInterface.removeColumn('session_data', 'resolved_at');
    await queryInterface.removeColumn('session_data', 'manual_fields');

    for (const column of NUMERIC) {
      await queryInterface.changeColumn('session_data', column, {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },
};
