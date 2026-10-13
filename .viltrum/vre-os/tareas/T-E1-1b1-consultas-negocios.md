# T-E1-1b1 · Negocios: consultas de lectura reales, por rol, con `test:db`

Ficha: M03

Perfil: **D10 Backend** (con D11 en la parte SQL). Productor: Codex (gpt-6.1-sol, vía HAPI). Revisión independiente: Antigravity (otro proveedor) + orquestador con comandos.
Ficha: `.viltrum/vre-os/spec/modulos/M03-negocios.md` §5 «Consultas nuevas», §8 CA-02, 04, 05, 11, 13, 28. Decisión firmada #47 (`docs/contexto/decisiones.md:311`).
Modo: fix, escribes código. **Sin git, sin commit, sin `npm run dev` ni `npm run build`**, sin tocar la VPS ni leer `.env*`. Máximo 45 min.

## Defecto actual (verificado)
`src/app/(crm)/negocios/page.tsx` (189 líneas) consulta la base con SQL dentro de la página (`getDb()` desde `app/`), carga todos los negocios para resolver uno y no restringe el precio real ni la comisión de terceros por rol. Receta de capas: `src/application/README.md`; ejemplo a seguir: `src/application/dashboard/consultas.ts` + su repositorio.

## Qué construir
1. `src/application/pipeline/consultas.ts` (y los tipos/puertos en `puertos.ts`): `consultarTableroNegocios`, `consultarListaNegocios` (filtros proyecto/broker/etapa/resultado/moneda/monto/fecha, orden estable con ID de desempate, cursor), `consultarCatalogosNegocios`, `consultarFichaNegocio` (por ID, 404 si no es visible, sin cargar todos), `resumirNegocios` (conteos y montos por etapa **y por divisa**, nunca sumar monedas distintas). La capa de aplicación NO importa Drizzle, Next ni proveedor.
2. Todo el SQL en `src/infrastructure/db/repos/` (adaptador de lectura de pipeline), registrado en `src/infrastructure/contenedor/pipeline.ts`. Filtrar proyectos con `EXISTS`, no con join que multiplique filas: el interés N:M **no puede inflar** filas, conteos ni sumas.
3. Alcance por rol aplicado en servidor (`scopeFor(actor, "deals", "view")`): `own` solo ve sus negocios, `all` todos, `none` nada. ID ajeno → 404.
4. **DTO restrictivo por rol (CA-11):** el broker ve y edita `amountCents` (monto comercial propio). El **precio de lista real** de la unidad y la **comisión de terceros** solo los recibe el admin: deben quedar fuera del SELECT y del DTO, no solo ocultos en JSX.
5. Migrar `page.tsx` y `vista.tsx`/`inspector.tsx` a consumir esas consultas (sin cambiar el diseño; la interfaz completa es otra tarea). Cero cifras ni listas fijas en la vista. Texto visible dice «Negocios», nunca «Pipeline».

## Pruebas obligatorias
- Unitarias con doble en memoria (patrón de `casos-de-uso.test.ts`) para alcance own/all/none, filtros, borde inclusivo de fechas, N:M sin inflar, ID ajeno, y ausencia de precio real/comisión de terceros en el DTO del broker (usa valores centinela).
- **`npm run test:db`** contra PostgreSQL real: añade casos en `scripts/test-db/` (sigue `fixture.ts`/`shapes.ts`) que comparen los totales de `resumirNegocios` y de la lista con una **consulta de control** independiente sobre los 184 negocios sembrados.
- **Prueba de mutación** (patrón de `test:db:mutation:*` en `scripts/test-db/run.mjs`): una mutación que haga que el filtro por proyecto use join (infla conteos) debe hacer caer la prueba; documenta el comando.
- Guardas de arquitectura (`arquitectura.test.ts`, `seguridad.test.ts`) siguen en verde, sin debilitarlas.

## Hecho cuando (pega la salida real de cada comando en la entrega)
`npm run typecheck` · `npm run lint` · `npm test` · `npm run test:db` · `npm run spec:check` sin errores nuevos. No declares nada «hecho» si un comando falla.

## Entrega
`.viltrum/vre-os/evidencia/E1/negocios/D10-b1-consultas.md`: archivos tocados, decisiones, salida de los cinco comandos, comando de la mutación y su resultado, y lo que quede sin verificar. Termina con `ESTADO: ENTREGADO` o `ESTADO: BLOQUEADO — motivo`.
