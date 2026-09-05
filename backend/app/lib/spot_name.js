'use strict';

// Spot-name comparison, kept out of the service so it has no database import
// and can be exercised on its own.

/*
 * Two spot names are "the same" when they normalize to the same string. Used
 * only to catch an obvious re-add of a spot somebody already contributed, so
 * it strips case, accents and punctuation but nothing meaningful: North Jetty
 * and South Jetty are different breaks and must stay different.
 */
const normalizeName = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '');

const sameSpotName = (a, b) => {
  const left = normalizeName(a);
  return left.length > 0 && left === normalizeName(b);
};

module.exports = { normalizeName, sameSpotName };
