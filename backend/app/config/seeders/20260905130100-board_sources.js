'use strict';

// redistributable governs TEXT, not images. EOS is a paid subscription: the
// facts it supplies (year, maker, designer, dimensions) carry no copyright and
// are publishable, the prose is Matt Warshaw's and is not.
const now = new Date();

const sources = [
  ['user', 'Site contributors', null, null, true, 'user-contributed'],
  ['eos', 'Encyclopedia of Surfing', 'https://www.eos.surf', 'https://www.eos.surf/subscribe', false, 'subscriber-content'],
  ['shopify', 'Brand Shopify stores', null, null, false, 'brand-permission'],
  ['boardcave', 'Boardcave reviews', 'https://www.boardcave.com/reviews/surfboards', null, false, 'rights-reserved'],
  ['surfresearch', 'surfresearch.com.au', 'https://www.surfresearch.com.au', null, false, 'rights-reserved'],
  ['shacc', 'Surfing Heritage and Culture Center', 'https://shacc.emuseum.com', null, false, 'rights-reserved'],
  ['wikimedia', 'Wikimedia Commons', 'https://commons.wikimedia.org', 'https://commons.wikimedia.org/wiki/Commons:Licensing', true, 'CC-BY-SA-3.0'],
  ['openimages', 'Open Images', 'https://storage.googleapis.com/openimages/web/index.html', null, true, 'CC-BY-4.0'],
  ['glazewave', 'Written or rendered here', 'https://glazewave.com', null, true, 'own-work'],
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [licenses] = await queryInterface.sequelize.query(
      'SELECT id, code FROM image_licenses'
    );
    const byCode = new Map(licenses.map((l) => [l.code, l.id]));

    return queryInterface.bulkInsert('board_sources', sources.map((row) => ({
      source_key: row[0],
      name: row[1],
      url: row[2],
      terms_url: row[3],
      redistributable: row[4],
      default_license_id: byCode.get(row[5]) || null,
      created_at: now,
      updated_at: now,
    })), {});
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete('board_sources', null, {});
  },
};
