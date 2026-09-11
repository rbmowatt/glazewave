# Database backups

Nightly `mysqldump` of `surfbook` to a private S3 bucket, plus a restore check
that proves the file is worth having.

`backend/.env` rides along, because it exists on the box and nowhere else and
holds the MySQL password, the Cognito ids and the demo RS256 signing key.

Elasticsearch is not backed up. Both indexes rebuild from MySQL with
`npm run sync-elastic`, so a dump is the only thing that has to survive.

## Layout

```
s3://glazewave-backups-<account>/
  daily/YYYY/MM/DD/surfbook-<stamp>.sql.gz     30 days
  monthly/surfbook-<stamp>.sql.gz              365 days, written on the 1st
  env/<stamp>-backend.env                      90 days
  status/last-success.json                     overwritten each run
```

The instance role can PUT and GET but **cannot DELETE.** Retention is the
bucket lifecycle's job. Anything that compromises the box can write junk into
new keys; it cannot erase the history.

## Install

```
cd /opt/glazewave/ops/backup
sudo ./setup.sh <backups-bucket> <alerts-topic-arn>
```

Both values come from `terraform output`. Setup creates `gw_backup` (SELECT on
`surfbook` only) and `gw_restore` (SELECT on `surfbook`, everything on the
scratch schema), writes their credentials to `/etc/glazewave/*.cnf` at mode
600, installs the units and enables the timer.

## Restoring, for a bad day

Find what exists:

```
aws s3 ls s3://<bucket>/daily/ --recursive | tail -20
aws s3 cp s3://<bucket>/status/last-success.json -
```

Pull it and look before loading it:

```
aws s3 cp s3://<bucket>/daily/YYYY/MM/DD/surfbook-<stamp>.sql.gz /var/backups/glazewave/
gzip -dc /var/backups/glazewave/surfbook-<stamp>.sql.gz | head -40
gzip -dc /var/backups/glazewave/surfbook-<stamp>.sql.gz | tail -5
```

The last line must read `-- Dump completed on ...`. Anything else is a
truncated file and the next-oldest backup is the one to use.

Restore beside the live database first, never over it:

```
sudo mysql -e "CREATE DATABASE surfbook_restored CHARACTER SET utf8mb4"
gzip -dc /var/backups/glazewave/surfbook-<stamp>.sql.gz | sed -e 's/DEFINER=[^ ]*//g' | sudo mysql surfbook_restored
sudo mysql -e "SELECT COUNT(*) FROM surfbook_restored.sessions"
```

Only once that looks right, swap:

```
sudo systemctl stop glazewave-api
sudo mysql -e "CREATE DATABASE surfbook_broken; "
sudo mysqldump surfbook | sudo mysql surfbook_broken
sudo mysql -e "DROP DATABASE surfbook; CREATE DATABASE surfbook CHARACTER SET utf8mb4"
gzip -dc /var/backups/glazewave/surfbook-<stamp>.sql.gz | sed -e 's/DEFINER=[^ ]*//g' | sudo mysql surfbook
sudo systemctl start glazewave-api
```

Then rebuild the search indexes, or every list in the app reads from stale
documents:

```
cd /opt/glazewave/backend && npm run sync-elastic
```

Keeping the broken copy is the point. A restore made from a misread symptom is
recoverable; one that dropped the evidence is not.

## Checking that backups still work

```
sudo GLAZEWAVE_BACKUP_BUCKET=<bucket> /usr/local/bin/glazewave-restore-check.sh
```

It downloads the newest daily object, restores it into
`surfbook_restore_check`, compares every table's real row count against the
live schema, and drops the scratch copy. It refuses to run unless free disk is
twenty times the compressed dump.

A table that is populated live and empty in the restore fails the check. Small
per-table differences are printed as drift and do not fail: rows written
between the dump and the check are normal.

## When it breaks

A failed run publishes the last forty journal lines to the SNS topic. That
subscription is not live until the address confirms it by email — until then
`aws sns publish` succeeds and delivers to nobody.

```
systemctl list-timers glazewave-backup.timer
journalctl -u glazewave-backup -n 60 --no-pager
```

`systemctl is-active` is not evidence for a oneshot unit. Read the journal, or
read `status/last-success.json` and check its date.
