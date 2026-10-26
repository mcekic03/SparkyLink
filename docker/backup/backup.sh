#!/bin/sh
# Svake noci u BACKUP_TIME (lokalno vreme, TZ): dump baze; nedeljom i arhiva
# fajlova iz storage/app/private (slike, video, fiskalni racuni, obracuni).
# Sve ide u /backups; starije od BACKUP_KEEP_DAYS dana se brise.
set -eu

BACKUP_TIME="${BACKUP_TIME:-02:30}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"

run_backup() {
    stamp=$(date +%Y-%m-%d_%H%M)
    mkdir -p /backups/db /backups/files

    echo "[backup] baza -> /backups/db/sparkylink_${stamp}.sql.gz"
    mysqldump -h"${DB_HOST}" -uroot -p"${DB_ROOT_PASSWORD}" \
        --single-transaction --quick --routines --no-tablespaces "${DB_DATABASE}" \
        | gzip > "/backups/db/sparkylink_${stamp}.sql.gz.part"
    mv "/backups/db/sparkylink_${stamp}.sql.gz.part" "/backups/db/sparkylink_${stamp}.sql.gz"

    if [ "$(date +%u)" = "7" ] && [ -d /storage/app/private ]; then
        echo "[backup] fajlovi -> /backups/files/sparkylink_files_${stamp}.tar.gz"
        tar -czf "/backups/files/sparkylink_files_${stamp}.tar.gz" -C /storage/app private
    fi

    find /backups -type f -mtime +"${KEEP_DAYS}" -delete
}

if [ "${1:-}" = "now" ]; then
    run_backup
    exit 0
fi

echo "[backup] ceka ${BACKUP_TIME} svakog dana (cuva ${KEEP_DAYS} dana)"
while true; do
    if [ "$(date +%H:%M)" = "${BACKUP_TIME}" ]; then
        run_backup || echo "[backup] GRESKA - pokusacu sutra"
        sleep 61
    fi
    sleep 30
done
