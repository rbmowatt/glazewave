'use strict';

// Wikimedia Commons reports a licence as a display string in extmetadata's
// LicenseShortName - "CC BY-SA 4.0", "CC BY 3.0 us", "Public domain". Those are
// not our image_licenses.code values, and the mapping has to live in exactly one
// place or the seeder and the loader will disagree about which rows exist.
//
// The jurisdiction ports ("3.0 us", "3.0 pl", "3.0 cl") are separate licences,
// not cosmetic variants, so they get their own rows rather than folding into
// CC-BY-3.0. Their obligations happen to match, but that is a fact about those
// three, not a rule.
//
// Case and inner whitespace vary between Commons files, so lookup normalizes
// before matching. An unknown string returns null and the loader treats that as
// a hard failure: an image whose licence we cannot name is an image we cannot
// publish, and skipping it silently is how a spot ends up with no photo for a
// reason nobody can find six months later.

const MAP = {
  'cc0': 'CC0',
  'public domain': 'public-domain',
  'cc by 2.0': 'CC-BY-2.0',
  'cc by 2.5': 'CC-BY-2.5',
  'cc by 3.0': 'CC-BY-3.0',
  'cc by 3.0 us': 'CC-BY-3.0-US',
  'cc by 3.0 pl': 'CC-BY-3.0-PL',
  'cc by 3.0 cl': 'CC-BY-3.0-CL',
  'cc by 4.0': 'CC-BY-4.0',
  'cc by-sa 2.0': 'CC-BY-SA-2.0',
  'cc by-sa 2.5': 'CC-BY-SA-2.5',
  'cc by-sa 3.0': 'CC-BY-SA-3.0',
  'cc by-sa 3.0 de': 'CC-BY-SA-3.0-DE',
  'cc by-sa 4.0': 'CC-BY-SA-4.0',
};

function normalize(shortName) {
  return String(shortName || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function codeFor(shortName) {
  return MAP[normalize(shortName)] || null;
}

module.exports = { MAP, normalize, codeFor };
