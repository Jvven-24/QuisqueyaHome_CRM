#!/bin/sh
# Respaldo diario de la base del CRM (pg_dump custom), conserva 14 días. Ligero: nice/ionice.
set -e
D=/opt/qh-dev/backups/diarios; F="$D/crm-$(date +%Y%m%d-%H%M).dump"
nice -n 19 ionice -c3 docker exec qh-dev-db-1 pg_dump -U postgres -Fc crm > "$F.tmp" && mv "$F.tmp" "$F"
find "$D" -name "crm-*.dump" -mtime +14 -delete
