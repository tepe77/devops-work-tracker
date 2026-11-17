#!/usr/bin/env bash
# DevOps Work Tracker - Backup Script
# Mencadangkan database MySQL / PostgreSQL / SQLite dan seluruh berkas evidence private

set -eo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_CONNECTION="${DB_CONNECTION:-mysql}"
DB_NAME="${DB_DATABASE:-devops_tracker}"
DB_USER="${DB_USERNAME:-root}"
DB_PASS="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

mkdir -p "${BACKUP_DIR}"

echo "=== Memulai Backup DevOps Work Tracker [${TIMESTAMP}] ==="

# 1. Backup Database
DB_BACKUP_FILE="${BACKUP_DIR}/db_${DB_NAME}_${TIMESTAMP}.sql.gz"
echo "-> Membuat dump database (${DB_CONNECTION})..."

if [ "${DB_CONNECTION}" = "mysql" ] || [ "${DB_CONNECTION}" = "mariadb" ]; then
    if [ -n "${DB_PASS}" ]; then
        mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" | gzip > "${DB_BACKUP_FILE}"
    else
        mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" "${DB_NAME}" | gzip > "${DB_BACKUP_FILE}"
    fi
    echo "✓ MySQL database backup tersimpan di: ${DB_BACKUP_FILE}"
elif [ "${DB_CONNECTION}" = "pgsql" ]; then
    PGPASSWORD="${DB_PASS}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}" | gzip > "${DB_BACKUP_FILE}"
    echo "✓ PostgreSQL database backup tersimpan di: ${DB_BACKUP_FILE}"
else
    if [ -f "database/database.sqlite" ]; then
        cp database/database.sqlite "${BACKUP_DIR}/sqlite_${TIMESTAMP}.db"
        DB_BACKUP_FILE="${BACKUP_DIR}/sqlite_${TIMESTAMP}.db"
        echo "✓ SQLite database backup tersimpan di: ${DB_BACKUP_FILE}"
    fi
fi

# 2. Backup Evidence Files
EVIDENCE_SRC="storage/app/private/evidences"
EVIDENCE_BACKUP_FILE="${BACKUP_DIR}/evidences_${TIMESTAMP}.tar.gz"
echo "-> Mencadangkan file evidence privat..."
if [ -d "${EVIDENCE_SRC}" ]; then
    tar -czf "${EVIDENCE_BACKUP_FILE}" -C "storage/app/private" evidences
    echo "✓ Evidence backup tersimpan di: ${EVIDENCE_BACKUP_FILE}"
else
    echo "Catatan: Direktori ${EVIDENCE_SRC} kosong atau belum dibuat."
fi

echo "=== Backup Selesai dengan Sukses [${TIMESTAMP}] ==="
