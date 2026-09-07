# Flujo de trabajo — CRM Quisqueya Home

Cómo se trabaja en el **repositorio de producción**. Si buscas cómo funcionaba
el prototipo (vinext, Cloudflare Workers, D1), eso vive en
`referencia-prototipo/` y ya no aplica a nada de aquí.

## Antes de tocar código

- `MAPEO_FRONTEND_CRM.md` es el documento vinculante: §10 tiene las reglas de
  negocio, §12 el inventario por módulo, §18 las fronteras de cada uno.
- `docs/contexto/decisiones.md` explica **por qué** el código es como es. Si algo
  parece raro, probablemente hay una decisión ahí que lo explica.
- `docs/SUPABASE.md` si todavía no tienes base de datos configurada.

## Poner en marcha

```bash
npm install                # Node >=22.13.0
cp .env.example .env       # y rellenar — ver docs/SUPABASE.md
npm run db:migrate
npm run db:seed
npm run dev
```

## Pasos para un cambio

```bash
git checkout develop && git pull
git checkout dev/<tu-nombre>        # tu rama personal, creada desde develop
# … trabajar …
npm run typecheck && npm run lint && npm test && npm run build
```

Los cuatro comandos son los mismos que corre la CI en cada PR. Si pasan en
local, pasan allí.

Después: PR contra `develop`. Cuando `develop` esté estable, PR contra `main`.
**`main` y `develop` están protegidas**: no se comitea directo a ninguna.

### Cambios de esquema

`src/infrastructure/db/schema.ts` está **congelado** (§18.1): todo cambio va en
su propio PR, con su migración generada (`npm run db:generate`) y revisado
aparte. Nunca dos migraciones en dos ramas a la vez — los conflictos en el
journal de Drizzle son caros.

### Detalle que muerde: `Closes #N` no cierra al mergear a `develop`

GitHub solo cierra issues automáticamente cuando el PR se mergea a la **rama por
defecto** (`main`). Como aquí se mergea a `develop`, hay que **cerrar los issues
a mano** tras el merge. Escribir `Closes #N` en la descripción igualmente vale la
pena: enlaza el issue con el PR y deja el rastro.

## El patrón de código

**Lecturas** desde componentes de servidor, **escrituras** por route handlers
(§20.2). Los ejemplos vivos están en `src/infrastructure/README.md`.

Tres reglas que no se negocian:

1. **El permiso se comprueba en servidor, siempre.** `requireScopeInPage` en
   páginas, `requireScope` en route handlers. Ocultar un botón no es seguridad.
2. **Nadie escribe su propio filtro por responsable.** Se usa `visibleRows`. Si
   cada módulo filtra a su manera, la seguridad deja de ser auditable (§18.1).
3. **Nadie abre su propia conexión ni lee `process.env` por su cuenta.**
   `getDb()` e `infrastructure/env.ts`.

## Checklist de "terminado" para un módulo

Derivado de `MAPEO_FRONTEND_CRM.md` §16 y `AUDITORIA_FUNCIONAL_CRM.md` §11:

- [ ] Cada control ejecuta una acción real (no solo un aviso) y respeta permisos.
- [ ] Los cambios persisten y quedan con autor y fecha.
- [ ] Hay prueba automática del flujo (crear, asignar, contactar, mover, perder,
      cerrar, según aplique).
- [ ] Un usuario sin permiso no puede leer ni modificar el dato, **verificado en
      servidor**.
- [ ] Si agrega o cierra un negocio, la operación es transaccional: `transaction()`
      de `infrastructure/db/client.ts`, con los 8 pasos de §10.2.
- [ ] Se registra en `audit_log` cuando la acción modifica datos sensibles (T6).
- [ ] Las métricas que muestra vienen de una consulta, no de una constante.

## Entornos y despliegue

Hoy: **desarrollo contra el proyecto de Supabase en la nube y `npm run dev` en
local. No hay staging ni producción, y es deliberado.**

El despliegue y la migración al VPS de Hostinger se hacen **al final, en una sola
operación**, con el programa terminado y funcionando (decisión #17). El
procedimiento y la lista de comprobación para ese día están en
`docs/DESPLIEGUE.md` §5.

## Orden de construcción

Ruta crítica de §13: **T1 → T2 → T3 → T4 → T7 → M1 → M2 → M3**.

F0 está cerrada (todo lo anterior a M1). Lo siguiente es **F1**: T5 estados de
interfaz, T6 auditoría, M1 Contactos, M2 Leads, M3 Pipeline.

Corre en paralelo sin depender del núcleo comercial: M5 Propiedades, M10 Academy
y M13 Configuración. Van obligatoriamente al final, porque agregan lo que los
demás producen: M12 Reportes, M14 Inicio y M15 Notificaciones.
