'use strict';

// The catalog facts. canonical_key is the harvest upsert key and the only
// reason a second run updates rows instead of duplicating every model.
//
// year_confidence ranks how the year was obtained, not how likely it is:
//   field       an actual yearIntroduced column (EOS). The only authoritative one.
//   stated      a release verb next to the number in marketing copy.
//   title       the year is in the model name, so it is design vintage or season.
//   mentioned   a four-digit year somewhere in the description. Noise.
//   boilerplate demoted: the same year appeared across a maker's whole feed,
//               which is a founding year in house copy ("since 1969"), not a release.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = {
      slug: { type: Sequelize.STRING(180) },
      canonical_key: { type: Sequelize.STRING(220) },
      designer: { type: Sequelize.STRING(180) },
      category: { type: Sequelize.STRING(60) },
      discontinued: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      year_introduced: { type: Sequelize.SMALLINT.UNSIGNED },
      year_confidence: {
        type: Sequelize.ENUM('field', 'stated', 'title', 'mentioned', 'boilerplate'),
      },
      year_evidence: { type: Sequelize.STRING(255) },
      length_in: { type: Sequelize.DECIMAL(6, 3) },
      width_in: { type: Sequelize.DECIMAL(6, 3) },
      thickness_in: { type: Sequelize.DECIMAL(6, 3) },
      volume_l: { type: Sequelize.DECIMAL(6, 2) },
    };

    for (const [name, spec] of Object.entries(columns)) {
      await queryInterface.addColumn('boards', name, spec);
    }

    // MySQL allows repeated NULLs in a unique index, so rows a person typed
    // before the loader ran do not have to carry a key.
    await queryInterface.addIndex('boards', ['canonical_key'], {
      name: 'uq_board_canonical',
      unique: true,
    });
    await queryInterface.addIndex('boards', ['manufacturer_id', 'year_introduced'], {
      name: 'ix_board_maker_year',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('boards', 'ix_board_maker_year');
    await queryInterface.removeIndex('boards', 'uq_board_canonical');
    for (const name of ['volume_l', 'thickness_in', 'width_in', 'length_in',
      'year_evidence', 'year_confidence', 'year_introduced', 'discontinued',
      'category', 'designer', 'canonical_key', 'slug']) {
      await queryInterface.removeColumn('boards', name);
    }
  },
};
