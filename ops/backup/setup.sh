#!/bin/bash
#
# One-time setup on the box. Creates the two MySQL accounts, writes the
# credential files, installs the scripts and units, and enables the timer.
#
#   sudo ./setup.sh <backups-bucket> <alerts-topic-arn>
#
# Reads the MySQL admin connection from the environment: set MYSQL_ADMIN to a
# working mysql invocation. Defaults to `mysql` as root over the socket.

set -euo pipefail

BUCKET="${1:?usage: setup.sh <backups-bucket> <alerts-topic-arn>}"
TOPIC="${2:?usage: setup.sh <backups-bucket> <alerts-topic-arn>}"
DB="${GLAZEWAVE_DB:-surfbook}"
CHECK_DB="${DB}_restore_check"
ADMIN="${MYSQL_ADMIN:-mysql}"

[ "$(id -u)" -eq 0 ] || { echo "run with sudo" >&2; exit 1; }

# root on this box authenticates by password, not auth_socket, so a bare
# `mysql` fails with ERROR 1045. Checked here rather than halfway through
# account creation, which would leave one user made and the other not.
if ! $ADMIN -e "SELECT 1" >/dev/null 2>&1; then
  cat >&2 <<MSG
cannot connect to MySQL as an admin.

Either put root's credentials in /root/.my.cnf at mode 600, or run this with
an explicit connection:

  sudo MYSQL_ADMIN="mysql -u root -p" ./setup.sh <bucket> <topic>
MSG
  exit 1
fi

# validate_password runs at MEDIUM on this box: upper, lower, digit and a
# special character are all required, so a plain hex string is rejected.
newpass() { printf '%s' "$(openssl rand -base64 24 | tr -d '/+=' | head -c 20)Aa1!"; }

backup_pass="$(newpass)"
restore_pass="$(newpass)"

$ADMIN <<SQL
CREATE USER IF NOT EXISTS 'gw_backup'@'localhost' IDENTIFIED BY '${backup_pass}';
ALTER USER 'gw_backup'@'localhost' IDENTIFIED BY '${backup_pass}';
GRANT SELECT, SHOW VIEW, TRIGGER, EVENT ON \`${DB}\`.* TO 'gw_backup'@'localhost';

CREATE USER IF NOT EXISTS 'gw_restore'@'localhost' IDENTIFIED BY '${restore_pass}';
ALTER USER 'gw_restore'@'localhost' IDENTIFIED BY '${restore_pass}';
GRANT SELECT, SHOW VIEW ON \`${DB}\`.* TO 'gw_restore'@'localhost';
GRANT ALL PRIVILEGES ON \`${CHECK_DB}\`.* TO 'gw_restore'@'localhost';
FLUSH PRIVILEGES;
SQL

install -d -m 700 /etc/glazewave
install -d -m 700 /var/backups/glazewave

# A password on the mysqldump command line shows in ps to every user on the
# box, so it lives here instead.
umask 077
cat > /etc/glazewave/backup.cnf <<CNF
[client]
user=gw_backup
password=${backup_pass}
CNF

cat > /etc/glazewave/restore.cnf <<CNF
[client]
user=gw_restore
password=${restore_pass}
CNF

cat > /etc/glazewave/backup.env <<ENV
GLAZEWAVE_BACKUP_BUCKET=${BUCKET}
GLAZEWAVE_ALERT_TOPIC=${TOPIC}
GLAZEWAVE_DB=${DB}
AWS_DEFAULT_REGION=us-east-1
ENV

chmod 600 /etc/glazewave/backup.cnf /etc/glazewave/restore.cnf /etc/glazewave/backup.env

here="$(cd "$(dirname "$0")" && pwd)"
install -m 755 "$here/glazewave-backup.sh"        /usr/local/bin/glazewave-backup.sh
install -m 755 "$here/glazewave-alert.sh"         /usr/local/bin/glazewave-alert.sh
install -m 755 "$here/glazewave-restore-check.sh" /usr/local/bin/glazewave-restore-check.sh
install -m 644 "$here/glazewave-backup.service"   /etc/systemd/system/glazewave-backup.service
install -m 644 "$here/glazewave-backup.timer"     /etc/systemd/system/glazewave-backup.timer
install -m 644 "$here/glazewave-alert@.service"   /etc/systemd/system/glazewave-alert@.service

systemctl daemon-reload
systemctl enable --now glazewave-backup.timer

echo
echo "installed. next:"
echo "  sudo systemctl start glazewave-backup.service"
echo "  journalctl -u glazewave-backup -n 40 --no-pager"
