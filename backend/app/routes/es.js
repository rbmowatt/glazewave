const { Router } = require('express');
const express = require('express');
const NodeCache = require('node-cache');
const { Client } = require('@elastic/elasticsearch');
const elasticConfig = require('./../config/elastic');
const UserService = require('./../services/UserService');

// The browser never learns the real index names. It asks for a logical key and
// this map resolves it, so a rename in backend/.env cannot strand a frontend
// build that inlined the old name.
const INDEXES = {
  sessions: () => process.env.ELASTIC_SESSIONS_INDEX,
  user_boards: () => process.env.ELASTIC_USER_BOARDS_INDEX,
};

// ReactiveList plus two MultiLists is four searches per interaction. Anything
// well past that is someone hand-rolling a body, not the UI.
const MAX_SEARCHES = 12;
const MAX_BODY = '256kb';

// Cognito hands us a username; every indexed document is scoped by the MySQL
// users.id. Without this the scope lookup costs a DB round-trip per keystroke
// in the facet inputs.
const userIdCache = new NodeCache({ stdTTL: 300 });

const client = new Client({ node: elasticConfig.host });
const router = new Router();

// appbase-js posts application/x-ndjson, which the app-level bodyParser.json()
// does not claim, so the stream is still unread by the time we get here.
router.use(
  express.text({
    type: ['application/x-ndjson', 'application/json', 'text/plain'],
    limit: MAX_BODY,
  })
);

async function resolveUserId(username) {
  const cached = userIdCache.get(username);
  if (cached !== undefined) return cached;
  const rows = await UserService.make().where({ wheres: { username }, limit: 1 });
  if (!rows || !rows.length) return null;
  userIdCache.set(username, rows[0].id);
  return rows[0].id;
}

// The client builds its own filters in the browser, so they are advisory at
// best - devtools can replace them. The caller's whole query becomes a `must`
// and the ownership test goes in as a `filter` it cannot reach.
function scopeQuery(body, userId) {
  const caller = body && body.query ? body.query : { match_all: {} };
  return Object.assign({}, body, {
    query: {
      bool: {
        must: [caller],
        filter: [
          {
            bool: {
              should: [
                { term: { user_id: userId } },
                { term: { is_public: 1 } },
              ],
              minimum_should_match: 1,
            },
          },
        ],
      },
    },
  });
}

function parseNdjson(raw) {
  const lines = String(raw)
    .split('\n')
    .filter((line) => line.trim().length);
  return lines.map((line) => JSON.parse(line));
}

function resolveIndex(req, res) {
  const resolver = Object.prototype.hasOwnProperty.call(INDEXES, req.params.index)
    ? INDEXES[req.params.index]
    : null;
  if (!resolver) {
    res.status(404).send({ message: 'Unknown index.' });
    return null;
  }
  const index = resolver();
  if (!index) {
    // A missing ELASTIC_*_INDEX would otherwise reach the client as an opaque
    // 500 from the ES client half a second later.
    res.status(503).send({ message: `No index configured for ${req.params.index}.` });
    return null;
  }
  return index;
}

router.post('/:index/_msearch', async function (req, res) {
  const index = resolveIndex(req, res);
  if (!index) return;

  let parsed;
  try {
    parsed = parseNdjson(req.body);
  } catch (err) {
    return res.status(400).send({ message: 'Malformed _msearch body.' });
  }
  if (parsed.length % 2 !== 0) {
    return res.status(400).send({ message: 'Malformed _msearch body.' });
  }
  if (parsed.length / 2 > MAX_SEARCHES) {
    return res.status(413).send({ message: 'Too many searches in one request.' });
  }

  try {
    const userId = await resolveUserId(req.user.username);
    if (userId === null) {
      return res.status(403).send({ message: 'No account for this token.' });
    }

    const body = [];
    for (let i = 0; i < parsed.length; i += 2) {
      // Header lines carry an index the caller chose; the URL is the only
      // source we honor.
      body.push(Object.assign({}, parsed[i], { index }));
      body.push(scopeQuery(parsed[i + 1], userId));
    }

    const resp = await client.msearch({ index, body });
    res.send(resp.body);
  } catch (err) {
    console.error('es proxy _msearch failed', err);
    res.status(500).send({ message: 'Search failed.' });
  }
});

router.post('/:index/_search', async function (req, res) {
  const index = resolveIndex(req, res);
  if (!index) return;

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (err) {
    return res.status(400).send({ message: 'Malformed search body.' });
  }

  try {
    const userId = await resolveUserId(req.user.username);
    if (userId === null) {
      return res.status(403).send({ message: 'No account for this token.' });
    }
    const resp = await client.search({ index, body: scopeQuery(body, userId) });
    res.send(resp.body);
  } catch (err) {
    console.error('es proxy _search failed', err);
    res.status(500).send({ message: 'Search failed.' });
  }
});

module.exports = router;
