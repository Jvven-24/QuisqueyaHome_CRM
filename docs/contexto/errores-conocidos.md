# Errores conocidos / gotchas — CRM Quisqueya Home

Dos listas distintas, y conviene no confundirlas:

- **§1** son trampas del **repositorio de producción**, confirmadas al construirlo.
- **§2** son defectos del **prototipo** que el repo de producción tiene que
  arreglar. Están aquí porque son la lista de cosas que se olvidan al portar una
  pantalla: si nadie las anota, se reproducen tal cual.

---

## 1. Trampas del repositorio de producción (confirmadas)

### Conexión a Supabase

- **La conexión directa de Supabase es solo IPv6.** `db.<ref>.supabase.co` no
  tiene registro A. En una red sin IPv6 fiable daba **1 conexión buena de cada
  8**, con `ENOTFOUND` en el resto — un fallo intermitente que parece un
  problema del código. Se usa el **session pooler**, que responde por IPv4. Está
  escrito en `.env.example` y es comprobación obligatoria antes de desplegar al
  VPS (`docs/DESPLIEGUE.md` §5).
- **PgBouncer en modo transacción no admite sentencias preparadas.** Por eso
  `db/client.ts` construye el cliente con `prepare: false`. Quitarlo rompe en
  producción, no en local.
- **La conexión se arma en la primera consulta, no al importar el módulo.**
  `next build` carga todos los módulos para descubrir las rutas y ahí todavía no
  hay variables de entorno de base de datos.

### Permisos y errores

- **Una página sin permiso devolvía 500 en vez de 403.** El dato no se filtraba,
  pero la excepción escapaba y salía la pantalla de error genérica. En páginas se
  usa `requireScopeInPage` (que llama a `forbidden()` de Next); en route handlers
  se deja lanzar y `errorResponse` traduce. **No los intercambies.**
- **Un recurso sin fila en `permissions` queda cerrado**, no abierto. Es el fallo
  correcto, pero significa que un módulo nuevo no se ve hasta que su permiso
  entra en el seed.
- **`scope=team` se comporta hoy como `own`** porque el esquema no tiene equipos.
  Está anotado en `domain/rbac.ts` y en `rbac-filter.ts`, y en ningún otro sitio
  habrá que tocarlo cuando exista el modelo de equipos.
- **`deleted_at` se olvida y su olvido no da error**: devuelve registros borrados
  como si existieran. Por eso el filtro de papelera va dentro de `visibleRows` y
  no en cada consulta.

### Validación y pruebas

- **`z.string().min(1, "…")` solo traduce el error de cadena vacía**, no el de
  campo ausente. Un mensaje se coló en inglés por esto. Para campos obligatorios
  hay que traducir también el error de tipo/requerido.
- **`npm test` corre con el borrado de tipos de Node**, que no admite propiedades
  de parámetro de TypeScript (`constructor(public x)`). Por eso `ValidationError`
  declara `fields` aparte. Si una clase del dominio usa esa forma, las pruebas
  fallan con un error que no menciona la causa.

### Operación

- **Las altas de usuario son manuales** (crear en Supabase Auth + `INSERT` en
  `users`) hasta que exista M13, en F2. Documentado en `docs/SUPABASE.md` §5.
- **`scripts/crear-broker-prueba.mjs` es una fixture de desarrollo.** Crea el
  usuario directamente en `auth.users` porque Supabase rechaza los dominios de
  prueba y un `signUp` con dominio real le mandaría un correo a un tercero. **No
  se corre en producción.**
- **`Closes #N` no cierra el issue al mergear a `develop`.** GitHub solo cierra
  automáticamente contra la rama por defecto (`main`). Hay que cerrarlos a mano.

---

## 2. Defectos del prototipo que el repo de producción debe arreglar

No son bugs de este código: son la lista de lo que **no** hay que reproducir al
portar cada pantalla. Están catalogados en `MAPEO_FRONTEND_CRM.md` §8.

### Interfaz (los arregla T5, en F1)

- **No existen estados de carga, error ni «sin permiso».** Solo existe `Empty`.
- **El Kanban no tiene columna para `Perdido`**: un negocio marcado como perdido
  desaparece de la vista sin dejar rastro.
- **El modal `"lost"` está declarado y nunca se renderiza.** Marcar un negocio
  como perdido no pide motivo en ninguna parte.
- **Los filtros son inertes** en Leads, Contactos, Pipeline, Propiedades,
  Comisiones y Academy: existen visualmente y no alteran los datos.
- **Botones que solo lanzan un aviso**: exportar reporte, exportar a Excel, nuevo
  contacto, nuevo proyecto, invitar broker, ver perfil, asignar propiedades,
  nueva tarea, nueva plantilla, publicar en el portal.

### Modelo de datos (lo arregla el esquema, ya portado en F0)

- Contacto y Lead eran **el mismo objeto**: un contacto no podía tener dos
  oportunidades ni conservar historial tras cerrarse un negocio.
- Broker y proyecto eran **texto**, no referencias. El filtrado por rol comparaba
  nombres (`broker === "Yostar Medina"`).
- Tareas y citas eran **estructuras separadas** sin vínculo a contacto ni a
  negocio.
- Las fases de obra compartían **un único porcentaje global** en el estado raíz.

### Datos que la interfaz mostraba sin existir

Motivo de pérdida, probabilidad y fecha estimada de cierre, presupuesto con
mínimo/máximo/moneda, disponibilidad de unidades (`"12/40"` era literal), última
interacción (`"Hoy"` literal) y zona de interés del lead. Todos existen ya como
columnas; lo que falta es **calcularlos**, que es trabajo de F1 y F4.

### Agenda e integraciones

- Las citas usaban un índice de día (`1..5`) y hora entera, no fecha real, con un
  offset fijo escrito a mano. Una agenda real necesita fechas reales (M4, F2).
- El `UID` del `.ics` se generaba como `{day}-{time}@quisqueyahome.com`. Sirve de
  prueba de que hace falta un identificador estable por evento para no duplicar
  al sincronizar — para eso existe `activity_sync`.
- Nota explícita de la UI de Integraciones: **no se guardan tokens OAuth en el
  navegador.** Restricción a respetar cuando se implemente OAuth real.
