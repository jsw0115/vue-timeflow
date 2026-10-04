#!/bin/sh
set -eu
umask 077
cd "$(dirname "$0")/../.."
test -f infra/deploy/.env || { echo 'Create infra/deploy/.env first.' >&2; exit 1; }
backup_dir=infra/deploy/backups
mkdir -p "$backup_dir"
backup_file="$backup_dir/timeflow-$(date -u +%Y%m%dT%H%M%SZ).sql"
if docker compose --env-file infra/deploy/.env -f infra/deploy/compose.yml exec -T db \
    sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump -u timeflow --single-transaction --no-tablespaces timeflow' \
    > "$backup_file.partial"; then
    test -s "$backup_file.partial"
    mv "$backup_file.partial" "$backup_file"
    printf 'Database backup saved: %s\n' "$backup_file"
else
    echo 'Backup failed; do not proceed with deployment.' >&2
    exit 1
fi
