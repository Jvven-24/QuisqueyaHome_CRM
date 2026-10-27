# Inventario de contenedores (VPS)

- PDF oficial: [VT-INF-R01 Inventario Docker VPS v1.0](https://drive.google.com/file/d/10HxbIf5QpU1vOV0jgc6iF07bRUYU7eTm/view)
- Despliegue: solo vía `/opt/qh-dev/remoto.sh` (ver [DESPLIEGUE.md](../DESPLIEGUE.md), [ops/](../ops/)).

```
qh-dev-app-1|node:22-alpine|Up 6 minutes||qh-dev
qh-dev-auth-1|supabase/gotrue:v2.189.0|Up 12 hours||qh-dev
qh-test-db|postgres:16-alpine|Up 13 hours|127.0.0.1:55432->5432/tcp|
qh-hermes|nousresearch/hermes-agent:stable|Up 12 hours||qh-hermes
exp-demo-wp|wordpress:php8.4-apache|Up 9 days|80/tcp|exp-demo
exp-demo-db|mariadb:11.4|Up 9 days (healthy)|3306/tcp|exp-demo
qh-dev-moodle-1|erseco/alpine-moodle:v4.5.15|Up 9 days (healthy)|8080/tcp|qh-dev
qh-dev-db-1|postgres:15-alpine|Up 9 days (healthy)|5432/tcp|qh-dev
qh-dev-proxy-1|caddy:2-alpine|Up 9 days|80/tcp, 443/tcp, 127.0.0.1:9330->9330/tcp, 2019/tcp, 443/udp, 127.0.0.1:54331->54331/tcp, 127.0.0.1:3201->3000/tcp|qh-dev
viltrum-wa-relay|node:22-alpine|Up 9 days (healthy)||viltrum-wa-relay
quisqueya-portal|quisqueya-staging-portal-staging|Up 9 days (healthy)|8787/tcp|quisqueya-portal
quisqueya-crm-staging-app|quisqueya-crm-staging:7a57988|Up 9 days|127.0.0.1:3101->3000/tcp|
quisqueya-crm-staging-auth-gotrue-1|supabase/gotrue:v2.189.0|Up 9 days||quisqueya-crm-staging-auth
quisqueya-crm-staging-auth-proxy-1|caddy:2-alpine|Up 9 days|80/tcp, 443/tcp, 2019/tcp, 443/udp|quisqueya-crm-staging-auth
quisqueya-portal-staging|quisqueya-staging-portal-staging|Up 9 days (healthy)|8787/tcp|quisqueya-staging
quisqueya-staging-db|supabase/postgres:17.6.1.136|Up 9 days (healthy)|5432/tcp|quisqueya-staging
supabase-caddy|df7f1c2fb114|Up 9 days|0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp, 0.0.0.0:443->443/udp, [::]:443->443/udp, 2019/tcp|supabase
viltrum-bot-tunnel|cloudflare/cloudflared:latest|Up 9 days||viltrum-bot
viltrum-bot|python:3.12-slim|Up 9 days (healthy)|127.0.0.1:8088->8080/tcp|viltrum-bot
viltrum-runtime-runtime-1|viltrum-runtime-runtime|Up 9 days (healthy)|127.0.0.1:8788->8787/tcp|viltrum-runtime
llm-stack-tunnel-1|b269e8abd07a|Up 9 days||llm-stack
twenty-worker-1|twentycrm/twenty:latest|Up 9 days||twenty
twenty-server-1|twentycrm/twenty:latest|Up 9 days (healthy)|0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp|twenty
twenty-db-1|postgres:16|Up 9 days (healthy)|5432/tcp|twenty
twenty-redis-1|redis|Up 9 days (healthy)|6379/tcp|twenty
mcp-oauth-gateway|node:22.14.0-alpine3.21|Up 9 days||supabase
supabase-pooler|supabase/supavisor:2.9.5|Up 9 days (healthy)||supabase
supabase-storage|supabase/storage-api:v1.60.4|Up 9 days (healthy)|5000/tcp|supabase
supabase-edge-functions|supabase/edge-runtime:v1.74.0|Up 9 days (healthy)||supabase
realtime-dev.supabase-realtime|supabase/realtime:v2.102.3|Up 9 days (healthy)||supabase
supabase-meta|supabase/postgres-meta:v0.96.6|Up 9 days (healthy)|8080/tcp|supabase
supabase-auth|supabase/gotrue:v2.189.0|Up 9 days (healthy)||supabase
supabase-rest|postgrest/postgrest:v14.12|Up 9 days (healthy)|3000/tcp|supabase
supabase-envoy|envoyproxy/envoy:v1.39.0|Up 9 days (healthy)|10000/tcp|supabase
supabase-db|supabase/postgres:17.6.1.136|Up 9 days (healthy)|5432/tcp|supabase
supabase-imgproxy|darthsim/imgproxy:v3.30.1|Up 9 days (healthy)|8080/tcp|supabase
supabase-studio|supabase/studio:2026.08.03-sha-022b374|Up 9 days (healthy)|3000/tcp|supabase
```
