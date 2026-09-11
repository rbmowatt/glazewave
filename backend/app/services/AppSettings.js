'use strict';

const NodeCache = require('node-cache');
const db = require('./../models');

/*
 * Runtime feature switches, read on the request path and flipped from the
 * admin panel.
 *
 * Every flag here defaults OFF and the default lives in this file, not in a
 * seeder and not in the migration. A key with no row is off, an unreadable
 * database is off, an unrecognized value is off. The one direction this must
 * never fail is open: these gate the surfaces that accept text and photographs
 * from the public, and there is no moderation UI yet.
 */

// The flags that exist. An unknown key is off and says so in the log rather
// than quietly answering false forever, because the usual cause is a typo in
// a route's requireFeature() call and that reads as "the flag will not turn on".
const FLAGS = [
  'spot_notes',
  'spot_description_edits',
  'spot_community_photos',
];

/*
 * 30s, where Viewer.js caches for 300. A flag is flipped by hand and watched,
 * so half a minute of staleness is the ceiling on "why is it not on yet" -
 * and set() forgets the key outright, which makes the normal path instant.
 *
 * Correct only because one instance runs one node process. A second instance
 * and this cache is wrong: two boxes would disagree about whether a feature is
 * live until both TTLs lapse. Move it to Redis before scaling out.
 */
const cache = new NodeCache({ stdTTL: 30 });

// What counts as on. Anything else - '0', '', 'no', a NULL that got through,
// a value somebody typed by hand into MySQL - is off.
const TRUTHY = ['1', 'true', 'on', 'yes'];

const isKnown = (name) => {
  if (FLAGS.includes(name)) return true;
  console.error(`AppSettings: unknown flag "${name}", answering off`);
  return false;
};

async function enabled(name) {
  if (!isKnown(name)) return false;

  const cached = cache.get(name);
  if (cached !== undefined) return cached;

  let on = false;
  try {
    const row = await db.AppSetting.findByPk(name);
    on = Boolean(row) && TRUTHY.includes(String(row.value).trim().toLowerCase());
  } catch (err) {
    // Fail closed and do NOT cache: a flag stuck off for 30s after the
    // database blips would outlast the blip and look like the flip failed.
    console.error('AppSettings read failed, answering off:', err.message);
    return false;
  }

  cache.set(name, on);
  return on;
}

/*
 * Every flag at once, in one query, for the block the spot detail response
 * carries so the page renders from server truth rather than its own guess.
 * One round trip, not one per flag - this rides on an unauthenticated route.
 */
async function all() {
  const out = {};
  FLAGS.forEach((name) => { out[name] = false; });

  const missing = FLAGS.filter((name) => {
    const cached = cache.get(name);
    if (cached === undefined) return true;
    out[name] = cached;
    return false;
  });
  if (!missing.length) return out;

  try {
    const rows = await db.AppSetting.findAll({ where: { setting_key: missing } });
    const found = new Map(rows.map((row) => [row.setting_key, row.value]));
    missing.forEach((name) => {
      const on = found.has(name)
        && TRUTHY.includes(String(found.get(name)).trim().toLowerCase());
      out[name] = on;
      cache.set(name, on);
    });
  } catch (err) {
    console.error('AppSettings read failed, answering all off:', err.message);
  }

  return out;
}

async function set(name, on, userId = null) {
  if (!FLAGS.includes(name)) throw new Error(`AppSettings: unknown flag "${name}"`);

  await db.AppSetting.upsert({
    setting_key: name,
    value: on ? '1' : '0',
    updated_by: userId,
  });
  // Before returning, not after: the admin panel reads the flag back to render
  // the toggle it just moved, and a stale read there looks like a failed write.
  cache.del(name);
  return on;
}

const forget = (name) => cache.del(name);
const forgetAll = () => cache.flushAll();

module.exports = { FLAGS, enabled, all, set, forget, forgetAll };
