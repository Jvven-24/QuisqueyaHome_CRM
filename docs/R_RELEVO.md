# R · Relevo

<!-- rediseno-movil-p1:start -->
## Rediseño móvil · pasada 1 de 2 — 2026-10-30

Rama `orq/claude-web/rediseno-movil-p1` (desde `codex/wilber-crm-20261026`); sin merge, PR ni despliegue. Mejora móvil (390) y web (1440) vía piezas compartidas: `PageHeader`, `Dialog` como hoja inferior, hoja «Más» deslizable con vaul (anclajes 60 %/94 %), tarjeta móvil de `DataTable`, `ResumenCompacto`, «Ver como broker» flotante/en «Más», estado de conexión solo sin red, pestañas de sección unificadas. Inicio, Leads, Inventario, Contactos, Agenda y Tareas compactados. Menú y buscador sin tocar. Sin dependencias nuevas.

**Verificación observada:** typecheck limpio; lint 0 errores (4 avisos previos); npm test **1216 · 1214 aprobadas · 0 fallos · 2 omitidas**; build OK. Se corrigió la prueba intermitente `google-cuentas.test.ts` (fallaba 1/16). Capturas antes/después de 22 módulos + 3 fichas en `docs/rediseno/p1/` (detalle en su README). Pendiente: revisión independiente y comentarios en vivo de Wilber (pasada 2).
<!-- rediseno-movil-p1:end -->

<!-- fase3:start -->
## Fase 3 RBAC · entrega local autorizada — 2026-10-27

Rama `codex/wilber-crm-20261026`. Manager, overrides auditados con precedencia central, equipos/supervisores reales, matriz por rol y broker y ver-como de solo lectura implementados. Conceder leads:edit all permite reasignación sin cambiar de rol; manager no lo recibe por defecto. Commits: 88fd49d (datos/dominio), fa4c183 (administración/API), 70bf483 (interfaz) y este commit (reasignación/evidencia).

**Verificación final observada:** Node 22.23.4; typecheck y lint limpios; npm test: **1126 aprobadas, 2 omitidas, 0 fallos**. Ficha `specs/fase3-rbac/spec.md` BUILT/L3; evidencia y revisión estática de seguridad en `docs/ENTREGA_FASE3_RBAC.md`. Migración **0017_rbac_supervision.sql** idempotente y journal actualizado, **sin aplicar**. Antes de desplegar debe aplicarse tras respaldo: auth ya consulta las tablas nuevas. Sin build/dev ni push. Pendientes: BD real, recorrido/capturas UI y revisión independiente (Gemini CLI sin autenticación; no hubo informe). No se cierran issues ni se declara VERIFIED.

Esta entrega autoriza explícitamente producir, probar localmente y commitear en la rama actual; las restricciones incompatibles del relevo histórico de abajo no aplican a esta tarea.
<!-- fase3:end -->

## Entrega autorizada en rama fase2-tmp — 2026-10-27

Ambas fases implementadas: bitácora de notas persistente para lead y negocio, permisos y borrado lógico; pipeline configurable, reglas por slug/kind, versión de transición e historial visible. Fase 1: afc59f1; fase 2: este commit. Evidencia y límites en `docs/ENTREGA_NOTAS_PIPELINE.md`; ficha READY en `specs/entrega-notas-pipeline/spec.md`. Verificación final observada: typecheck y lint limpios; npm test 1095 aprobadas, 2 omitidas, 0 fallos con Node 22. UI/BD real pendientes porque no hay servidor local. No migraciones nuevas ni aplicadas. Sin push. El relevo histórico de abajo se conserva como contexto; esta tarea autoriza explícitamente producir y commitear en la rama actual.


**Este archivo se reescribe en cada push y describe el commit donde vive.** Si
lo estás leyendo, describe el estado exacto de este commit, no otro.

Para qué sirve: que cualquiera —Codex desde la terminal, una sesión nueva de
Claude, una sesión en la nube, o tú— pueda retomar el trabajo en frío sin
depender de ninguna conversación. El chat se pierde y se compacta; esto no.

Diseño que lo gobierna:
`docs/superpowers/specs/2026-10-02-flujo-claude-codex-y-relevo-design.md`.

---

## 1. Dónde estamos

| | |
|---|---|
| **Rama** | `develop` |
| **Fecha** | 2026-10-26 |
| **Fase** | **TRANSFORMACIÓN DE DISEÑO Y MÓDULOS 360 COMPLETADA (Private Desk)** |
| **Pruebas** | **1,030 en verde**, `typecheck` y `lint` limpios (0 errores) |

### Módulos completados y elevados al estándar Private Desk
- `/inicio`: Dashboard Ejecutivo 360 con 4 KPIs maestros, embudo comercial, agenda del día y ranking de proyectos.
- `/negocios`: Tablero Kanban de 7 columnas, totales tabulares dorados, DealInspector 360 con auditoría cronológica, y vista de lista TanStack.
- `/leads`: Franja de métricas, chips temáticos de canales, semáforo de temperatura comercial y botón «Tomar lead» concurrente.
- `/contactos`: Directorio con avatares de lujo, ficha patrimonial 360 y acciones WhatsApp/llamada de 48px.
- `/propiedades` & `/propiedades/[slug]`: Bento Grid en Navy profundo, sello Confotur (Ley 158-01), barra de absorción, doble esquema de precios (Admin ve precio real con candado, Broker ve rango público) y matriz interactiva de unidades.
- `/avances`: Línea constructiva de 8 fases con nodos interactivos (`✓` completada, `%` en vivo), editor con slider ARIA accesible y bóveda de evidencia fotográfica con lightbox modal.
- `/brokers` & `/brokers/[id]`: Roster con avatares, niveles de carrera (`Junior`, `Senior`, `Top Producer`, `Top Leader`), cartera activa y ficha individual con histórico de metas.
- `/metas`: Donut circular SVG (*Goal Ring*), podio de medallas de honor (🥇, 🥈, 🥉), sparklines SVG de tendencia anual y comparativa de ventas mes a mes.
- `/comisiones`: 3 KPIs financieros multimoneda (USD vs DOP, regla M22), desglose de Split dual (Broker vs Agencia) y modal interactivo de porcentajes.
- `/agenda`: Calendario semanal (8:00 a 18:00) con código cromático, descarga `.ics` individual y semanal, y enlace a Google Calendar.
- `/tareas`: Checklist operativo con animación de tachado suave (`completed`), semáforo de urgencia y widget lateral de balance de carga.
- `/comunicaciones`: Catálogo de plantillas, simulador realista de smartphone para WhatsApp con variables dinámicas en vivo y monitor de canales.
- `/reportes`: Embudo secuencial con retención y caída porcentual entre etapas, gráfico de fuga comercial, ranking de proyectos y botón de impresión limpia ejecutiva en PDF.
- `/configuracion`: Navegación lateral interna, matriz RBAC con candados inmutables (`Lock`), selectores de alcance accesibles y papelera de reciclaje lógica (cero borrado físico).
- `/academy`: Hub sincronizado con Moodle 4.5 LMS local, avance circular SVG, checklists de inducción para nuevos asesores, bóveda de constancias oficiales con hash criptográfico SHA-256 y salvaguarda Q-C1-03 (aprobación de un solo nivel por Administrador, nadie se autoaprueba).

Después de R6.1: limpieza completa del repositorio y, al final, despliegue al
VPS para validación por módulos con el cliente (decisión #17).

---

## 2. Para Codex: qué probar

> Tu única tarea es **romper la interfaz**. No escribes código, no usas `git` ni
> `gh`, y **nunca** ejecutas `npm run dev` ni `npm run build` (dejan archivos en
> `.next/` que Windows no deja borrar). El servidor ya está levantado para ti.

### Pendiente de verificación

| Issue | Módulo | Estado |
|---|---|---|
| #48 | Proyectos, unidades, fases y fotos (R3.4) | `estado:verificar` |
| #49 | Usuarios, invitaciones y permisos (R3.5) | `estado:verificar` |

### Cómo trabajar

1. **Vitrina:** `D:\ViltrumTEK\Quisqueya_Home\crm-codex`, clavada al commit
   `bfc3228`, con el servidor corriendo en **`http://localhost:3001`**. (El 3000
   es el servidor del usuario; no lo toques.) Si el 3001 no responde, dilo y
   para: **no lo levantes tú**.
2. **Guion:** `docs/R_REGRESION.md` tiene el recorrido de los 13 módulos. Haz el
   del módulo que toca, y después sal del guion a propósito: entra con un
   usuario de alcance `own` donde debería ver solo lo suyo, manda formularios
   vacíos y con basura, pulsa dos veces, navega a un `id` que no te pertenece,
   sube un archivo que no sea imagen, recarga a media operación.
3. **Qué cuenta como fallo:** un error 500, una pantalla en blanco, un dato de
   otro usuario a la vista, una operación que se aplica dos veces, un mensaje de
   error que filtre detalles internos, o cualquier cosa que el guion diga que
   debe pasar y no pase.
4. **Dónde escribir:** un archivo por issue en
   `D:\ViltrumTEK\Quisqueya_Home\crm-codex\hallazgos\<issue>.md` —por ejemplo
   `hallazgos\R3.4.md`. Para cada hallazgo: **pasos exactos para reproducirlo**,
   qué esperabas y qué pasó. Sin pasos no sirve. Si no encuentras nada, escríbelo
   igual y dilo.

---

## 3. Qué sigue en código

**Siguiente issue: #50 (R3.6)** — comisiones, metas y brokers como casos de uso.
Depende de R3.5, que está cerrado, así que está listo para empezar.

Patrón a seguir, igual que los cinco módulos ya migrados (ver
`src/application/README.md`):

- `src/application/<modulo>/puertos.ts` — interfaces, sin Drizzle.
- `src/application/<modulo>/casos-de-uso.ts` — la lógica.
- `src/application/<modulo>/en-memoria.ts` — dobles para probar sin base de datos.
- `src/application/<modulo>/casos-de-uso.test.ts` — pruebas.
- `src/infrastructure/db/repos/<modulo>.ts` y
  `src/infrastructure/contenedor/<modulo>.ts`.
- Las rutas de `src/app/api/` quedan delgadas y dejan de importar
  `@/infrastructure/db/*`. `arquitectura.test.ts` lo exige en cuanto existe
  `src/application/<modulo>/`.

### Trampas conocidas

- **`git fetch` tiene que terminar sin error antes de comparar nada.** El 02/10
  un ref corrupto de 41 bytes en ceros rompía todos los fetch y el repositorio
  local pasó días ciego al remoto; se dio por perdido trabajo que estaba
  perfectamente pusheado. Si `fetch` falla, ese es el problema: arreglarlo
  primero. Ver `docs/contexto/errores-conocidos.md`.
- **Nada se prueba si no está pusheado**, y el push y este archivo van en el
  mismo commit.
- **Un issue se cierra solo cuando se vio la corrida de `npm test` en verde**,
  nunca por el informe de otro agente, y solo si su commit es ancestro de
  `dev/reestructuracion-solid`.
- **No se añaden funciones nuevas** (decisión #4) ni se cambia el esquema.
- Toda tabla nueva lleva RLS; toda ruta de API comprueba permisos. `npm test`
  falla si falta cualquiera de las dos.

### Pendiente de decisión del usuario

- **Hallazgo H32** (`docs/R_HALLAZGOS.md`): `editarActividad` asigna
  `cambios.dealId` sin releer el negocio nuevo con el alcance. Es **preexistente**
  —la migración conservó el comportamiento original, como se pidió— y arreglarlo
  es un cambio de comportamiento, que este milestone prohíbe. Hay que decidir si
  entra como excepción de seguridad o se deja para después.

---

## 4. Lo que hay que saber de R3.6 antes de seguir

R3.6 dejó una guarda nueva que conviene replicar, y un agujero que conviene
cerrar. Está en `docs/R_HALLAZGOS.md` como **H33**, y es lo más importante que
salió de esa migración.

Resumen: al migrar comisiones se hizo la prueba de mutación de rigor —quitar el
`{ of: commissions }` del bloqueo de fila— y **no cayó ninguna prueba**. Los
dobles en memoria no tienen concurrencia, así que no pueden ver un `FOR UPDATE`
que falta. Durante seis módulos creímos que sí.

Se cerró con una prueba que **lee el código del adaptador** y exige ese bloqueo,
la misma técnica de `seguridad.test.ts` y `arquitectura.test.ts`. Pero **sigue
abierto en dos adaptadores ya migrados**:

- `repos/pipeline.ts`: el `for("update")` del cierre y el `targetWhere` del
  índice parcial de la meta de compañía.
- `repos/leads.ts`: el `onConflictDoNothing` del webhook con su
  `where: isNull(leads.deletedAt)`.

**Ya está hecho**: las cuatro garantías tienen su guarda y las cuatro se
comprobaron por mutación (cada una cae por su nombre al romper lo que vigila).
H33 queda cerrado en los tres adaptadores.

Regla que deja para quien siga: **todo módulo que migre una garantía que no se
pueda observar con dobles en memoria —un bloqueo, un upsert atómico, un predicado
de índice parcial, una zona horaria en SQL— añade su guarda de lectura de código
en el mismo commit.** Es parte del patrón, no un extra.

Y una deuda concreta que **R4.3 debe deshacer**: `exportarComisionesCsv` recibe
la consulta de filas como dependencia (`leerFilas`) porque `consultarFilas` vive
en `app/(crm)/comisiones/_consulta.ts` e `infrastructure/` no puede importar
`app/`. Eso deja `FilaComision` y `FiltrosComisiones` duplicados entre
`application/comisiones/puertos.ts` y la página. R4.3 mueve la consulta a
`consultas.ts`, borra la copia y retira la inyección.
