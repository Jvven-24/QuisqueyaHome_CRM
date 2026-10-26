#!/usr/bin/env bash
# Redespliega el CRM de STAGING en la VPS (nunca produccion).
# Copia el commit actual (git archive HEAD) a /opt/quisqueya-crm-staging conservando su .env (chmod 600,
# no versionado), reconstruye la imagen y reemplaza el contenedor en la red quisqueya_staging, publicado
# solo en 127.0.0.1:3101 de la VPS. En local: tunel SSH a 127.0.0.1:3101 (docs/ops/crm-local-staging.md).
set -euo pipefail
HOST="${STAGING_SSH_HOST:-hostinger}"
DIR=/opt/quisqueya-crm-staging
NAME=quisqueya-crm-staging-app
IMAGE=quisqueya-crm-staging
COMMIT=$(git rev-parse --short HEAD)

git diff --quiet HEAD -- src || { echo "Hay cambios sin commit en src/: solo se despliega lo commiteado." >&2; exit 1; }
git archive --format=tar HEAD | ssh -o BatchMode=yes "$HOST" "mkdir -p $DIR && tar -x -C $DIR"
ssh -o BatchMode=yes "$HOST" "set -e; cd $DIR; test -f .env || { echo 'Falta .env de staging' >&2; exit 1; }
  docker build -q -t $IMAGE:$COMMIT -t $IMAGE:latest . >/dev/null
  docker rm -f $NAME >/dev/null 2>&1 || true
  docker run -d --name $NAME --restart unless-stopped --network quisqueya_staging --env-file .env \
    -p 127.0.0.1:3101:3000 $IMAGE:$COMMIT >/dev/null
  for i in \$(seq 1 30); do code=\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3101/login || true); [ \"\$code\" = 200 ] && break; sleep 2; done
  echo \"staging $COMMIT: /login \$code\""
