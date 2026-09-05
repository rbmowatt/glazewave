'use strict';

/*
 * sessions.session_date carried `defaultValue: new Date()` in its create
 * migration. That expression evaluated once, when the migration file was
 * loaded, and baked a literal timestamp into the column DDL rather than a
 * CURRENT_TIMESTAMP default. Nothing on the create path sends the field, so
 * every session written since inherited that one frozen instant - six of the
 * first eight share it across eight hours of real surfing.
 *
 * It is also the field the conditions lookup keys on, so a wrong date means
 * the wrong hour of open-meteo data was resolved against the session.
 *
 * Rows already written keep the frozen value: nothing in the database records
 * when those sessions actually happened, so there is no correct backfill. They
 * have to be corrected by hand or left alone.
 *
 * Split out of the numeric-conversion migration deliberately. That one was
 * committed as 20260905150000-alter-session-data-numeric-and-provenance.js and
 * has already run; re-running its work under a new filename is what produced
 * "Duplicate column name 'manual_fields'". A migration that does one thing can
 * be re-cut without dragging applied statements along with it.
 */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('sessions', 'session_date', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
  },

  down: (queryInterface, Sequelize) => {
    // The original frozen literal is deliberately not restored; dropping back
    // to no default is as far back as this goes.
    return queryInterface.changeColumn('sessions', 'session_date', {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },
};
