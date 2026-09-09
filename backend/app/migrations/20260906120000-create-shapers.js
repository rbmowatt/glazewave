'use strict';

// The person who designed the board, as distinct from the label it is sold
// under. Deliberately the same shape as manufacturers, because it has the same
// problem: one human is spelled several ways across feeds ("Britt Merrick",
// "B. Merrick", "britt merrick") and the loader has to land them on one row.
//
// The two are separate because a brand is not always a person and a person is
// not always a brand:
//   Firewire     one label, many designers - Slater Designs and Tomo are
//                separate collections in the harvest today
//   Pyzel        the label IS Jon Pyzel; both tables point at the same human
//   Softech, NSP a label with no named designer at all
//
// boards.designer stays as the raw string the source supplied. This table is
// the resolved entity, the same way year_evidence keeps the text that
// year_introduced was read out of.
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('shapers', {
      id: {
        type: Sequelize.INTEGER(11).UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      // Unique, and the loader's first lookup. MySQL allows repeated NULLs in
      // a unique index, so a shaper someone types in by hand can exist without
      // one until a harvest gives it a slug.
      slug: {
        type: Sequelize.STRING(120),
        unique: true,
      },
      aliases: {
        type: Sequelize.JSON,
      },
      website: {
        type: Sequelize.STRING(255),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: (queryInterface) => queryInterface.dropTable('shapers'),
};
