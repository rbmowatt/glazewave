#!/bin/bash
#
# Nightly logical backup of the surfbook database to S3.
#
# Run by the glazewave-backup systemd timer as root. Root because
# /etc/glazewave/backup.cnf holds the MySQL password at mode 600 and
# /opt/glazewave/backend/.env is owned by ssm-user.

set -euo pipefail

: "${GLAZEWAVE_BACKUP_BUCKET:?set in /etc/glazewave/backup.env}"

DB="${GLAZEWAVE_DB:-surfbook}"
DEFAULTS="${GLAZEWAVE_MYSQL_DEFAULTS:-/etc/glazewave/backup.cnf}"
ENV_FILE="${GLAZEWAVE_ENV_FILE:-/opt/glazewave/backend/.env}"

# Never /tmp. It is tmpfs on this box, so a dump parked there is holding RAM
# on a machine that idles near 240MB free.
WORKDIR="${GLAZEWAVE_BACKUP_DIR:-/var/backups/glazewave}"

# A local copy makes the common restore a decompress instead of a download.
KEEP_LOCAL=3

# Smaller than this and the dump is a header and nothing else.
MIN_BYTES=10240

stamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
daypath="$(date -u +%Y/%m/%d)"
dom="$(date -u +%d)"

mkdir -p "$WORKDIR"
chmod 700 "$WORKDIR"

dump="$WORKDIR/${DB}-${stamp}.sql.gz"

# gzip -6 rather than -9. Two cores share this box with Elasticsearch and MySQL,
# and -9 costs several times the CPU for a percent or two of size on a dump this
# small.
# --single-transaction takes a consistent InnoDB snapshot without locking the
# app out. --no-tablespaces is not cosmetic: without it mysqldump 8 emits
# tablespace statements and demands the global PROCESS privilege, which the
# backup user deliberately does not have.
mysqldump \
  --defaults-file="$DEFAULTS" \
  --single-transaction \
  --no-tablespaces \
  --routines \
  --triggers \
  --events \
  --default-character-set=utf8mb4 \
  "$DB" | gzip -6 > "$dump"

size="$(stat -c%s "$dump")"
if [ "$size" -lt "$MIN_BYTES" ]; then
  echo "dump is ${size} bytes, below the ${MIN_BYTES} floor" >&2
  exit 1
fi

# The real completeness test. mysqldump writes this trailer only after the last
# table is out, so its absence is a truncated dump - which a size check misses
# when the truncation happens late.
if ! gzip -dc "$dump" | tail -c 512 | grep -q -- '-- Dump completed'; then
  echo "dump has no completion trailer, treating as truncated" >&2
  exit 1
fi

live_tables="$(mysql --defaults-file="$DEFAULTS" -N -B -e \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${DB}' AND table_type = 'BASE TABLE'")"
dumped_tables="$(gzip -dc "$dump" | grep -c '^CREATE TABLE' || true)"

if [ "$dumped_tables" -ne "$live_tables" ]; then
  echo "dump holds ${dumped_tables} tables, the database has ${live_tables}" >&2
  exit 1
fi

base="$(basename "$dump")"
aws s3 cp --only-show-errors "$dump" "s3://${GLAZEWAVE_BACKUP_BUCKET}/daily/${daypath}/${base}"

# One retained copy per month, on its own lifecycle. The daily prefix expires
# well inside the window where a slow data corruption goes unnoticed.
if [ "$dom" = "01" ]; then
  aws s3 cp --only-show-errors "$dump" "s3://${GLAZEWAVE_BACKUP_BUCKET}/monthly/${base}"
fi

# Not a database file, and not reproducible from the repo: it carries the MySQL
# password, the Cognito pool and client ids, the S3 bucket name and the demo
# RS256 signing key. Losing the instance without it means rebuilding all of
# those by hand.
if [ -r "$ENV_FILE" ]; then
  aws s3 cp --only-show-errors "$ENV_FILE" "s3://${GLAZEWAVE_BACKUP_BUCKET}/env/${stamp}-backend.env"
fi

printf '{"completed_at":"%s","key":"daily/%s/%s","bytes":%s,"tables":%s}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$daypath" "$base" "$size" "$dumped_tables" \
  | aws s3 cp --only-show-errors - "s3://${GLAZEWAVE_BACKUP_BUCKET}/status/last-success.json"

ls -1t "$WORKDIR"/${DB}-*.sql.gz 2>/dev/null | tail -n +$((KEEP_LOCAL + 1)) | xargs -r rm -f

echo "backed up ${dumped_tables} tables, ${size} bytes, to daily/${daypath}/${base}"
