# Flujo de trabajo — CRM Quisqueya Home

## Antes de tocar código
1. Leer `MAPEO_FRONTEND_CRM.md` §18 para saber qué tablas y qué carpeta de ruta le pertenecen al módulo que vas a tocar (evita chocar con otro módulo).
2. Si el cambio toca `db/schema.ts`: está **congelado** — entra por su propio PR con migración generada aparte, revisado por separado (regla explícita en el esquema y en §18.1).
3. Si el cambio toca `app/page.tsx` mientras siga siendo un único componente cliente (957/956 líneas): cualquier trabajo en paralelo de otro módulo va a colisionar en el mismo archivo. La tarea T7 (separar en rutas) debe completarse antes de repartir módulos entre varias personas.
4. Si el cambio toca `app/globals.css`: son estilos globales sin ámbito por módulo — solo tocar lo global por acuerdo explícito; estilos nuevos van por módulo.

## Pasos para un cambio
1. `npm install` (Node `>=22.13.0`).
2. Editar bajo `app/` (frontend) o `db/schema.ts` + generar migración con `npm run db:generate` (backend/datos).
3. Lint: `npm run lint` (ESLint 9 + `eslint-config-next`).
4. Build: `npm run build` (`vinext build`).
5. Test: `npm test` — corre `npm run build` y luego `node --test tests/rendered-html.test.mjs` contra el build generado.
6. Dev local: `npm run dev` (`vinext dev`).

## Checklist de "terminado" (derivado de `AUDITORIA_FUNCIONAL_CRM.md` §11 y `MAPEO_FRONTEND_CRM.md` §16)
Para un módulo o funcionalidad concreta:
- [ ] Cada control ejecuta una acción real (no solo un toast) y respeta permisos.
- [ ] Los cambios persisten (no solo `useState`) y quedan con autor y fecha.
- [ ] Existe prueba automática para el flujo (crear, asignar, contactar, mover, perder, cerrar, según aplique).
- [ ] Un usuario sin permiso no puede leer ni modificar el dato **verificado en servidor**, no solo ocultando el botón en cliente.
- [ ] Si el módulo agrega o cierra un negocio: la operación es transaccional (ver regla de cierre transaccional en `MAPEO_FRONTEND_CRM.md` §10.2 — 8 pasos en una sola transacción).
- [ ] Se registra en `audit_log` cuando la acción modifica datos sensibles.
- [ ] Las métricas mostradas provienen de una consulta real, no de una constante en el JSX.

## Deploy
- Runtime: Cloudflare Workers vía `wrangler` (`worker/index.ts` es el entry point).
- Antes de desplegar con datos reales: `.openai/hosting.json` debe tener `d1` (y `r2` si aplica) configurados — hoy están en `null`, lo que **bloquea cualquier persistencia real desde el día uno** (riesgo señalado explícitamente en `MAPEO_FRONTEND_CRM.md` §14).
- [PENDIENTE: comando exacto de deploy (`wrangler deploy` u otro) y entorno(s) de destino — no se encontró script de deploy en `package.json` ni documentación de CI/CD en el repo].
- [PENDIENTE: pipeline de CI — `MAPEO_FRONTEND_CRM.md` §19 menciona "Actions: Typecheck, `npm run build` y pruebas en cada PR" como algo por crear, no como algo existente. No hay carpeta `.github/workflows` verificada].

## Orden de construcción recomendado (para no abrir todo a la vez)
Ruta crítica documentada: **T1 Datos → T2 Auth → T3 RBAC → T4 Acceso → T7 Rutas → M1 Contactos → M2 Leads → M3 Negocios**. Todo lo demás cuelga de ahí o corre en paralelo (M5 Propiedades, M10 Academy, M13 Configuración pueden empezar temprano; M12 Reportes, M14 Inicio, M15 Notificaciones van al final porque agregan lo que producen los demás). Detalle completo en `MAPEO_FRONTEND_CRM.md` §13 y §19.1.
