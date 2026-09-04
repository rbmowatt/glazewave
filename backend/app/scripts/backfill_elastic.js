// Reindexes documents into the EXISTING sessions and user_boards indexes.
//
// Deliberately does not delete or create anything. sync_elastic.js recreates
// the indexes from app/scripts/elastic/*_mappings.json, which omit
// number_of_replicas:0 -- on a single node that leaves the cluster yellow
// forever, because a replica shard has nowhere to go. Index creation belongs
// to elastic/create-indexes.sh, which reads the canonical mappings.
//
// Usage: node app/scripts/backfill_elastic.js [sessions|user_boards]

require('dotenv').config();
const db = require('./../services/sequelize');
const { QueryTypes } = require('sequelize');
const { Client } = require('@elastic/elasticsearch');
const elasticConfig = require('./../config/elastic');

const CHUNK = 500;

// Same projections BetterQueue writes on create/update. They have to stay in
// step or a backfilled document will differ from a freshly saved one.
const TARGETS = {
  sessions: {
    index: () => process.env.ELASTIC_SESSIONS_INDEX,
    sql: `SELECT sessions.id, sessions.user_id, title, sessions.rating,
                 user_boards.name as board, sessions.is_public,
                 locations.name as location, session_data.water_temperature,
                 session_data.swell_height, session_data.swell_period,
                 session_data.wave_height, session_data.wave_period,
                 session_data.pressure, session_data.wind_speed
          FROM sessions
          LEFT JOIN session_data ON sessions.id = session_data.session_id
          LEFT JOIN user_boards ON user_boards.id = sessions.board_id
          LEFT JOIN locations ON locations.id = sessions.location_id`,
  },
  user_boards: {
    index: () => process.env.ELASTIC_USER_BOARDS_INDEX,
    sql: `SELECT user_boards.user_id, user_boards.id, user_boards.name,
                 user_boards.rating, user_boards.is_public, user_boards.notes,
                 boards.model, manufacturers.name as manufacturer
          FROM user_boards
          LEFT JOIN boards ON boards.id = user_boards.board_id
          LEFT JOIN manufacturers ON manufacturers.id = boards.manufacturer_id`,
  },
};

const client = new Client({ node: elasticConfig.host });

async function backfill(name) {
  const target = TARGETS[name];
  const index = target.index();
  if (!index) throw new Error(`no index configured for ${name}`);

  const exists = await client.indices.exists({ index }, { ignore: [404] });
  if (exists.statusCode === 404) {
    throw new Error(`index ${index} does not exist -- run elastic/create-indexes.sh first`);
  }

  const rows = await db.query(target.sql, { type: QueryTypes.SELECT });
  console.log(`${name}: ${rows.length} rows in mysql -> index ${index}`);
  if (!rows.length) return { name, rows: 0, indexed: 0, failed: 0 };

  let indexed = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const body = slice.flatMap((doc) => [{ index: { _index: index, _id: doc.id } }, doc]);
    const resp = await client.bulk({ refresh: false, body });
    for (const item of resp.body.items) {
      const result = item.index || item.create;
      if (result.error) {
        failed += 1;
        // Every write path in this app swallows ES errors, which is how an
        // index ends up silently empty. Print the first few.
        if (failed <= 5) console.error(`  ${result._id}: ${JSON.stringify(result.error)}`);
      } else {
        indexed += 1;
      }
    }
  }

  await client.indices.refresh({ index });
  const count = await client.count({ index });
  console.log(`${name}: indexed ${indexed}, failed ${failed}, index now holds ${count.body.count}`);
  return { name, rows: rows.length, indexed, failed };
}

(async () => {
  const only = process.argv[2];
  const names = only ? [only] : Object.keys(TARGETS);
  for (const name of names) {
    if (!TARGETS[name]) throw new Error(`unknown target ${name}`);
  }

  let failures = 0;
  for (const name of names) {
    const result = await backfill(name);
    failures += result.failed;
  }
  await db.close();
  process.exit(failures ? 1 : 0);
})().catch((err) => {
  console.error(err.meta ? JSON.stringify(err.meta.body || err.meta, null, 2) : err);
  process.exit(1);
});
