#!/usr/bin/env bash
# DevOps Work Tracker - Restore Script
# Memulihkan database MySQL / PostgreSQL / SQLite dan berkas evidence dari arsip cadangan

set -eo pipefail

if [ -z "$1" ]; then
    echo "Penggunaan: $0 <path-to-db-backup.sql.gz> [path-to-evidences.tar.gz]"
    exit 1
fi

DB_BACKUP_FILE="$1"
EVIDENCE_BACKUP_FILE="$2"

DB_CONNECTION="${DB_CONNECTION:-mysql}"
DB_NAME="${DB_DATABASE:-devops_tracker}"
DB_USER="${DB_USERNAME:-root}"
DB_PASS="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

echo "=== Memulai Pemulihan (Restore) DevOps Work Tracker ==="

# 1. Restore Database
if [ -f "${DB_BACKUP_FILE}" ]; then
    echo "-> Memulihkan database (${DB_CONNECTION}) dari ${DB_BACKUP_FILE}..."
    if [ "${DB_CONNECTION}" = "mysql" ] || [ "${DB_CONNECTION}" = "mariadb" ]; then
        if [ -n "${DB_PASS}" ]; then
            gunzip -c "${DB_BACKUP_FILE}" | mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}"
        else
            gunzip -c "${DB_BACKUP_FILE}" | mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" "${DB_NAME}"
        fi
    elif [ "${DB_CONNECTION}" = "pgsql" ]; then
        PGPASSWORD="${DB_PASS}" gunzip -c "${DB_BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}"
    else
        echo "Format SQL SQLite:"
        gunzip -c "${DB_BACKUP_FILE}" | sqlite3 database/database.sqlite
    fi
    echo "✓ Database berhasil dipulihkan."
else
    echo "Error: File backup ${DB_BACKUP_FILE} tidak ditemukan!"
    exit 1
fi

# 2. Restore Evidences
if [ -n "${EVIDENCE_BACKUP_FILE}" ] && [ -f "${EVIDENCE_BACKUP_FILE}" ]; then
    echo "-> Memulihkan berkas evidence dari ${EVIDENCE_BACKUP_FILE}..."
    mkdir -p storage/app/private
    tar -xzf "${EVIDENCE_BACKUP_FILE}" -C storage/app/private/
    echo "✓ Berkas evidence berhasil dipulihkan."
fi

echo "=== Pemulihan (Restore) Selesai dengan Sukses ==="
