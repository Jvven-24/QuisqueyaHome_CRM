# Fase 2/3 — Notas, pipeline y RBAC (27 oct 2026, hora RD)

## Notas y pipeline
- ae45465 (notas) y 5500ad3 (pipeline configurable) ya estaban desplegados: el código en vivo coincidía con el repo.

## RBAC — desplegado ~8:25 AM RD
Commits en codex/wilber-crm-20261026 (ya en GitHub):
- 78019f5 rbac: excepciones por usuario (override > rol > none), alcance `team` real (líder y supervisor de equipos), ver-como solo lectura
- b2a6cf1 permisos: API para administrar excepciones y supervisores, con auditoría (solo admin)
- d3f188b configuración: pestaña de permisos por persona (herencia, badge "personalizado", restablecer al rol) y selector "Ver como broker"
- 20bb769 leads: reasignar solo con una concesión explícita
- 9c27d94 + 8010589: duplicado mío de lo mismo, revertido sin force-push (sin efecto neto)

Base de datos: pg_dump en /opt/qh-dev/backups/crm-pre-0017-20261027-1221.dump (UTC). Migración 0017 aplicada en una transacción: rol `manager` (Gerente/Supervisor, 24 permisos de equipo, nada sobre usuarios ni roles) y las tablas user_permission_overrides y manager_scopes, con RLS.

Tests: 1126 pasan, 2 omitidos, 0 fallan (Node 22). Incluyen pruebas de escalada: admin protegido sin overrides, ver-como no escribe, gerente fuera de su equipo, own no se amplía.

Prueba en vivo con admin.prueba: /login, /configuracion, /leads y /negocios responden 200 sin errores de JS. Configuración muestra Gerente y Ver como. POST /api/ver-como devuelve 200. En ver-como, crear un lead y editar permisos devuelven 403 (solo lectura). Al salir de ver-como se vuelve a ser admin.
Sin registro público: los usuarios solo los crea el admin.

## Falta
- Revisión independiente con gemini-4-argon-high: cursor-agent no devolvió nada en 11 min (timeout). Pendiente.
- Pruebas test:db y E2E con 3 usuarios reales (admin, gerente, broker). Aún no hay ningún usuario gerente ni equipos con supervisor configurados.
- Barrido visual de Configuración > permisos por persona en 320/390/768/1440 px.
- Revisar las rutas antiguas que comparan roleSlug==="admin" directamente en vez de usar requireScope (en ver-como ven el rol del broker, que es lo correcto, pero conviene auditarlas).
- No se registró en drizzle.__drizzle_migrations porque se aplicó con psql. La migración es idempotente.
