#!/bin/bash
#
# Restores the newest backup into a scratch schema and compares it to the live
# one. A backup that has never been restored is not a backup - it is a file.
#
# Needs a MySQL account that can CREATE and DROP a database, which the backup
# user deliberately cannot, so it reads /etc/glazewave/restore.cnf instead.

set -euo pipefail

: "${GLAZEWAVE_BACKUP_BUCKET:?set in /etc/glazewave/backup.env}"

DB="${GLAZEWAVE_DB:-surfbook}"
CHECK_DB="${GLAZEWAVE_CHECK_DB:-${DB}_restore_check}"
DEFAULTS="${GLAZEWAVE_RESTORE_DEFAULTS:-/etc/glazewave/restore.cnf}"
WORKDIR="${GLAZEWAVE_BACKUP_DIR:-/var/backups/glazewave}"

mysql_c() { mysql --defaults-file="$DEFAULTS" -N -B "$@"; }

if [ "${1:-}" = "--local" ]; then
  dump="$(ls -1t "$WORKDIR"/${DB}-*.sql.gz | head -1)"
else
  key="$(aws s3 ls "s3://${GLAZEWAVE_BACKUP_BUCKET}/daily/" --recursive \
    | sort -k1,2 | tail -1 | awk '{print $4}')"
  [ -n "$key" ] || { echo "no object under daily/" >&2; exit 1; }
  dump="${WORKDIR}/restore-check.sql.gz"
  aws s3 cp --only-show-errors "s3://${GLAZEWAVE_BACKUP_BUCKET}/${key}" "$dump"
  echo "checking ${key}"
fi

# Restored InnoDB pages run several times the compressed dump, and this box has
# one 30GB root volume holding MySQL, Elasticsearch and the app.
dump_bytes="$(stat -c%s "$dump")"
free_bytes="$(( $(df --output=avail /var/lib/mysql | tail -1) * 1024 ))"
if [ "$free_bytes" -lt "$(( dump_bytes * 20 ))" ]; then
  echo "only ${free_bytes} bytes free against a ${dump_bytes} byte dump; refusing" >&2
  exit 1
fi

cleanup() {
  mysql --defaults-file="$DEFAULTS" -e "DROP DATABASE IF EXISTS \`${CHECK_DB}\`" || true
  [ "${1:-}" = "keep" ] || rm -f "${WORKDIR}/restore-check.sql.gz"
}
trap cleanup EXIT

mysql --defaults-file="$DEFAULTS" -e \
  "DROP DATABASE IF EXISTS \`${CHECK_DB}\`; CREATE DATABASE \`${CHECK_DB}\` CHARACTER SET utf8mb4"

# DEFINER=`glazewave`@`localhost` is stamped on any view, trigger or routine
# mysqldump emits, and replaying it as a different account fails with "you need
# the SUPER or SET_USER_ID privilege". Stripped rather than privileged around,
# because a real restore into a rebuilt box faces exactly the same clause.
gzip -dc "$dump" | sed -e 's/DEFINER=[^ ]*//g' | mysql --defaults-file="$DEFAULTS" "$CHECK_DB"

tables_in() {
  mysql_c -e "SELECT table_name FROM information_schema.tables WHERE table_schema = '$1' AND table_type = 'BASE TABLE'" | sort
}

live_tables="$(tables_in "$DB")"
check_tables="$(tables_in "$CHECK_DB")"

missing="$(comm -23 <(echo "$live_tables") <(echo "$check_tables"))"
if [ -n "$missing" ]; then
  echo "tables missing from the restore:" >&2
  echo "$missing" >&2
  exit 1
fi

# information_schema.table_rows is an estimate for InnoDB and routinely off by
# a third, so it cannot be the comparison. Counted for real, per table.
failed=0
while read -r t; do
  [ -n "$t" ] || continue
  live="$(mysql_c -e "SELECT COUNT(*) FROM \`${DB}\`.\`${t}\`")"
  restored="$(mysql_c -e "SELECT COUNT(*) FROM \`${CHECK_DB}\`.\`${t}\`")"
  if [ "$live" -gt 0 ] && [ "$restored" -eq 0 ]; then
    echo "EMPTY  ${t}: live ${live}, restored 0" >&2
    failed=1
  elif [ "$live" -ne "$restored" ]; then
    # Rows written between the dump and this check are normal drift, not a
    # defect. Reported so a growing gap is visible, never fatal.
    echo "drift  ${t}: live ${live}, restored ${restored}"
  fi
done <<< "$live_tables"

[ "$failed" -eq 0 ] || exit 1
echo "restore verified: $(echo "$live_tables" | grep -c .) tables"
