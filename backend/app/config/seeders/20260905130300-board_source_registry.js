'use strict';

// The hand-compiled historical registry. redistributable is true because what
// it supplies is facts - maker, model, year, dimensions - and no prose or
// images come from it. default_license_id stays null for the same reason.
const now = new Date();

module.exports = {
  up: (queryInterface) => queryInterface.bulkInsert('content_sources', [{
    source_key: 'registry',
    name: 'Historical model registry (compiled)',
    url: null,
    terms_url: null,
    redistributable: true,
    default_license_id: null,
    created_at: now,
    updated_at: now,
  }], {}),

  down: (queryInterface) => queryInterface.bulkDelete('content_sources', { source_key: 'registry' }, {}),
};
