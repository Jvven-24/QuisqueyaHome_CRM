#!/bin/sh
# Se ejecuta EN LA VPS dentro de /opt/qh-dev. Uso: sh remoto.sh preparar|construir|desplegar|cambiar|revertir|levantar|estado
# Los secretos se generan aquí y no salen de la VPS (/opt/qh-dev/.env y app.env, chmod 600).
set -eu
cd /opt/qh-dev

aleatorio() { head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c "$1"; }

preparar() {
  if [ ! -f .env ]; then
    umask 077
    {
      echo "QH_DB_PASSWORD=$(aleatorio 32)"
      echo "QH_JWT_SECRET=$(aleatorio 48)"
      echo "QH_MOODLE_ADMIN=qhadmin"
      echo "QH_MOODLE_PASSWORD=$(aleatorio 20)A1!"
    } > .env
  fi
  if ! grep -q '^QH_TEST_ADMIN_PASSWORD=' .env; then
    umask 077
    { echo "QH_TEST_ADMIN_PASSWORD=$(aleatorio 18)Aa1#"; echo "QH_TEST_BROKER_PASSWORD=$(aleatorio 18)Aa1#"; } >> .env
  fi
  . ./.env
  # Claves anon y service_role firmadas con el secreto JWT del stack (HS256), como las genera Supabase.
  CLAVES=$(docker run --rm -e S="$QH_JWT_SECRET" node:22-alpine node -e '
    const c=require("crypto");const b=o=>Buffer.from(JSON.stringify(o)).toString("base64url");
    const f=r=>{const h=b({alg:"HS256",typ:"JWT"}),p=b({role:r,iss:"qh-dev",iat:1760000000,exp:2075000000});
      return h+"."+p+"."+c.createHmac("sha256",process.env.S).update(h+"."+p).digest("base64url")};
    console.log(f("anon")+" "+f("service_role"))')
  ANON=${CLAVES% *}; SERVICIO=${CLAVES#* }
  umask 077
  {
    echo "DATABASE_URL=postgres://postgres:${QH_DB_PASSWORD}@db:5432/crm"
    echo "NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON}"
    echo "SUPABASE_SERVICE_ROLE_KEY=${SERVICIO}"
    echo "MOODLE_URL=http://localhost:9330"
    [ -f moodle.token ] && echo "MOODLE_TOKEN=$(cat moodle.token)"
  } > app.env
  echo "preparado"
}

construir() {
  # Compilación con CPU y RAM acotadas para no afectar a los servicios de producción de la VPS.
  . ./app.env 2>/dev/null || true
  docker run --rm --cpus=2 --memory=3g --env-file app.env -e NEXT_TELEMETRY_DISABLED=1 -e NODE_OPTIONS=--max-old-space-size=2560 \
    -v /opt/qh-dev/app:/app -w /app node:22-alpine sh -c "npm ci --no-audit --no-fund && npx next build"
  echo "construido"
}

# Despliegue sin caída: se compila en app-next mientras app sigue sirviendo,
# y solo al final se cambia la carpeta y se recrea el contenedor (segundos).
# Uso: sh remoto.sh desplegar [/ruta/al/repo]   (por defecto /opt/dev/QuisqueyaHome_CRM)
REPO_DEFECTO=/opt/dev/QuisqueyaHome_CRM

construir_nuevo() {
  ORIGEN=${1:-$REPO_DEFECTO}
  rm -rf app-next && mkdir app-next
  # Solo lo versionado en HEAD (sin .env, node_modules ni .next del repo).
  git -C "$ORIGEN" archive HEAD | tar -x -C app-next
  docker run --rm --cpus=2 --memory=3g --env-file app.env -e NEXT_TELEMETRY_DISABLED=1 -e NODE_OPTIONS=--max-old-space-size=2560 \
    -v /opt/qh-dev/app-next:/app -w /app node:22-alpine sh -c "npm ci --no-audit --no-fund && npx next build"
  test -f app-next/.next/BUILD_ID || { echo "build incompleto: app sigue intacta"; exit 1; }
  echo "construido en app-next ($(git -C "$ORIGEN" rev-parse --short HEAD))"
}

cambiar() {
  test -f app-next/.next/BUILD_ID || { echo "no hay build en app-next"; exit 1; }
  rm -rf app-old && mv app app-old && mv app-next app
  docker compose -p qh-dev up -d --force-recreate app
  for i in $(seq 1 45); do
    if docker compose -p qh-dev exec -T app wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1; then echo "en vivo (anterior en app-old)"; return 0; fi
    sleep 2
  done
  echo "health falló: revirtiendo"; revertir; exit 1
}

revertir() {
  test -d app-old || { echo "no hay app-old"; exit 1; }
  rm -rf app-fallida && mv app app-fallida && mv app-old app
  docker compose -p qh-dev up -d --force-recreate app
  echo "revertido a la versión anterior"
}

desplegar() {
  construir_nuevo "${1:-$REPO_DEFECTO}"
  cambiar
}

levantar() {
  docker compose -p qh-dev up -d
  docker compose -p qh-dev ps --format "{{.Service}} {{.Status}}"
}

usuarios() {
  . ./.env
  QH_TEST_ADMIN_PASSWORD="$QH_TEST_ADMIN_PASSWORD" QH_TEST_BROKER_PASSWORD="$QH_TEST_BROKER_PASSWORD" \
    docker compose -p qh-dev exec -T -e QH_TEST_ADMIN_PASSWORD -e QH_TEST_BROKER_PASSWORD app node ops/vps-dev/usuarios.mjs
}

migrar() {
  # Migraciones oficiales del proyecto (drizzle) contra la base `crm` del stack.
  docker compose -p qh-dev exec -T app npx drizzle-kit migrate
}

estado() {
  docker compose -p qh-dev ps --format "{{.Service}} {{.Status}}"
  docker stats --no-stream --format "{{.Name}} {{.CPUPerc}} {{.MemUsage}}" | grep qh-dev || true
}

ACCION=$1; shift; "$ACCION" "$@"
