'use strict';

// "Pyzel", "Pyzel Surfboards" and "PYZEL" are the same maker across three feeds.
// aliases is what lets the loader resolve them onto one row.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('manufacturers', 'slug', {
      type: Sequelize.STRING(120),
    });
    await queryInterface.addColumn('manufacturers', 'aliases', {
      type: Sequelize.JSON,
    });
    await queryInterface.addColumn('manufacturers', 'website', {
      type: Sequelize.STRING(255),
    });
    await queryInterface.addIndex('manufacturers', ['slug'], {
      name: 'uq_manufacturer_slug',
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('manufacturers', 'uq_manufacturer_slug');
    await queryInterface.removeColumn('manufacturers', 'website');
    await queryInterface.removeColumn('manufacturers', 'aliases');
    await queryInterface.removeColumn('manufacturers', 'slug');
  },
};
