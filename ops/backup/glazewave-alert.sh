#!/bin/bash
#
# OnFailure handler. Mails the last of the failed unit's journal to the SNS
# topic, because NODE_ENV aside, nothing on this box surfaces a failed timer:
# systemd retries nothing and the next successful run overwrites the status
# object as though nothing happened.

set -uo pipefail

unit="${1:?usage: glazewave-alert.sh <unit>}"
: "${GLAZEWAVE_ALERT_TOPIC:?set in /etc/glazewave/backup.env}"

body="$(journalctl -u "$unit" -n 40 --no-pager 2>&1 || echo 'journal unavailable')"

aws sns publish \
  --topic-arn "$GLAZEWAVE_ALERT_TOPIC" \
  --subject "glazewave: ${unit} failed" \
  --message "${body}" \
  --output text > /dev/null
