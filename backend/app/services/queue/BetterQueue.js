'use strict';
require('dotenv').config();
const Queue = require('better-queue');
const db = require('./../../services/sequelize');
const elasticConfig = require('./../../config/elastic');
const { QueryTypes } = require('sequelize');
const { Client } = require('@elastic/elasticsearch');

// One client for the process. The previous version called new Client() once per
// document, so a batch of fifteen opened fifteen connection pools and dropped
// them.
let client = null;
const getClient = () => {
    if (!client) client = new Client({ node: elasticConfig.host });
    return client;
};

// The projections the index is built from. A backfill runs the same SQL (see
// scripts/backfill_elastic.js) so a rebuilt document matches a freshly saved
// one; change one and change the other.
const SESSION_SQL = `SELECT sessions.id, sessions.user_id, title, sessions.rating, user_boards.name as board, sessions.is_public, locations.name as location,
    session_data.water_temperature, session_data.swell_height, session_data.swell_period, session_data.wave_height, session_data.wave_period, session_data.pressure,
    session_data.wind_speed FROM sessions
    LEFT JOIN session_data ON sessions.id = session_data.session_id
    LEFT JOIN user_boards ON user_boards.id = sessions.board_id
    LEFT JOIN locations on locations.id = sessions.location_id where sessions.id IN (:ids)`;

const USER_BOARD_SQL = `SELECT user_boards.user_id,  user_boards.id, user_boards.name, user_boards.rating,
   user_boards.is_public, user_boards.notes,  boards.model, manufacturers.name as manufacturer  from user_boards
    LEFT JOIN boards on boards.id = user_boards.board_id
    LEFT JOIN manufacturers ON manufacturers.id = boards.manufacturer_id where user_boards.id IN (:ids)`;

async function indexBatch(rows, sql, index) {
    if (!index) throw new Error('no elasticsearch index configured');
    const ids = rows.map((row) => row.id);
    const docs = await db.query(sql, { type: QueryTypes.SELECT, replacements: { ids } });
    if (!docs.length) return 0;

    const body = docs.flatMap((doc) => [
        { update: { _index: index, _id: doc.id } },
        { doc, doc_as_upsert: true },
    ]);
    const resp = await getClient().bulk({ body });

    if (resp.body.errors) {
        const failed = resp.body.items.map((item) => item.update).filter((item) => item.error);
        throw new Error(
            `${failed.length}/${docs.length} documents rejected by ${index}: ${JSON.stringify(failed[0].error)}`
        );
    }
    return docs.length;
}

// better-queue expects exactly one callback per batch. The old handlers called
// cb inside the per-row loop and before the elasticsearch write resolved, so a
// batch reported success once per row and could never report failure - a row
// could be in MySQL and missing from the index with nothing in the log.
const makeHandler = (sql, indexEnvKey) => (rows, cb) => {
    indexBatch(rows, sql, process.env[indexEnvKey])
        .then((count) => cb(null, count))
        .catch((err) => {
            console.error(`elasticsearch index failed for ${indexEnvKey}: ${err.message}`);
            cb(err);
        });
};

// Both queues hold writes this long before flushing, so it is also how stale
// an index view can be right after an edit. Boards used to sit at 50s, which
// read as "the edit did not save".
const BATCH_DELAY_MS = 5000;

// Memoized. The model hooks call these on every save, and each call used to
// build a fresh Queue with its own timer, so nothing was ever batched with
// anything else and every edit waited out the full delay alone.
const queues = {};

const makeQueue = (key, sql, indexEnvKey, batchSize) => {
    if (!queues[key]) {
        queues[key] = new Queue(makeHandler(sql, indexEnvKey), {
            batchSize,
            batchDelay: BATCH_DELAY_MS,
            batchDelayTimeout: 1000,
        });
    }
    return queues[key];
};

const getSessionQueue = () =>
    makeQueue('sessions', SESSION_SQL, 'ELASTIC_SESSIONS_INDEX', 15);

const getUserBoardQueue = () =>
    makeQueue('user_boards', USER_BOARD_SQL, 'ELASTIC_USER_BOARDS_INDEX', 10);

module.exports = {
    getSessionQueue,
    getUserBoardQueue,
    getClient,
};
