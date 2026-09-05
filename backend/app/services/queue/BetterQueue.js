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

// Both projections live in services/elastic/projections.js, which backfill
// also imports. They were duplicated here and there with a comment asking that
// they be kept in step, and they were not.
const { SESSION_SQL, USER_BOARD_SQL } = require('./../elastic/projections');

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
