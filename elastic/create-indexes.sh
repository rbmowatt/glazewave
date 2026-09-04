#!/usr/bin/env bash
# Creates the Elasticsearch indexes the app queries. Run once per environment.
#
# Index names come from backend/.env because UserService and BetterQueue read
# them from there; hardcoding them here would let the two drift apart.
#
# Safe to re-run: an existing index is left alone. Mappings cannot be changed
# in place once an index has documents, so a mapping change means reindexing.

set -euo pipefail

cd "$(dirname "$0")"
ENV_FILE="../backend/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "missing $ENV_FILE" >&2
  exit 1
fi

get() {
  grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '"'"'"' \r'
}

HOST=$(get ELASTIC_SEARCH_HOST)
SESSIONS=$(get ELASTIC_SESSIONS_INDEX)
USER_BOARDS=$(get ELASTIC_USER_BOARDS_INDEX)

: "${HOST:?ELASTIC_SEARCH_HOST not set}"
: "${SESSIONS:?ELASTIC_SESSIONS_INDEX not set}"
: "${USER_BOARDS:?ELASTIC_USER_BOARDS_INDEX not set}"

echo "host: $HOST"

create() {
  local name="$1" file="$2"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "$HOST/$name")
  if [ "$code" = "200" ]; then
    echo "  exists, skipping: $name"
    return
  fi
  echo -n "  creating $name ... "
  curl -s -X PUT "$HOST/$name" \
    -H 'Content-Type: application/json' \
    --data-binary "@$file" \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print("ok" if d.get("acknowledged") else json.dumps(d))'
}

create "$SESSIONS" indexes/sessions.json
create "$USER_BOARDS" indexes/user_boards.json

echo
curl -s "$HOST/_cat/indices?v"
