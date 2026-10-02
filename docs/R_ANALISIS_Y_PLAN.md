# R · Reestructuración con metodología SOLID — análisis y plan de implementación

Milestone **Reestructuración con metodología SOLID**. Rama de integración
**`dev/reestructuracion-solid`**, creada desde `dev/jvven`, con PR en borrador
contra `develop` desde el primer día.

Este documento es la fuente de verdad del milestone. Los issues se crean **a
partir de la §7**, uno por bloque `### R…`, y un agente que abre una sesión
empieza por la §9 ("Cómo arranca una sesión").

Tasación aprobada el 29–30/09/2026 (artifact "Reestructuración del CRM con
principios SOLID", versión 3): **15,5–22 días de trabajo activo, unas 3 semanas**
con Claude y Codex en paralelo. Medido contra el repositorio real en `8c7d147`
(`npm test`: 125 pruebas en verde).

---

## 1. Qué entrega la reestructuración

Nada nuevo para el usuario final: **mismo comportamiento, otra estructura**. Al
terminar:

1. La lógica de negocio vive en **casos de uso** (`src/application/`) que dependen
   de interfaces, no de Drizzle. Se prueban sin base de datos.
2. Las rutas de la API y las páginas quedan **delgadas**: traducen HTTP o
   parámetros, autorizan, llaman a un caso de uso o a una consulta, y responden.
3. Una **prueba de arquitectura** impide volver atrás: `src/app/` no puede
   importar la base de datos.
4. El frontend usa **Tailwind CSS v4 + shadcn/ui (Radix)** con la paleta clara de
   `docs/DESIGN.md` y componentes de 21st.dev elegidos por medición.
5. `globals.css` (500 líneas) desaparece.

## 2. Estado real hoy, verificado en el repositorio

| Pieza | Estado | Evidencia |
|---|---|---|
| `src/domain/` | ✅ 15 archivos, reglas puras, 0 dependencias externas | `grep` de imports de next/drizzle/supabase vacío |
| `src/application/` | ❌ vacía (solo `README.md` y `.gitkeep`) | la decisión #16 la dejó para F1 y nunca se llenó |
| Rutas de API | 37 `route.ts`; **34 importan la base o el esquema** | `src/app/api/**` |
| Consultas Drizzle en `src/app/` | **198** | `select/insert/update/delete` |
| Páginas que arman su propio SQL | 18 archivos | `page.tsx`, `_consulta.ts`, `_ui/historial.tsx` |
| Componentes cliente | 35 con `"use client"`, 29 `fetch('/api…')` sueltos | las 10 vistas más grandes, de 228–411 líneas |
| Estilos | `globals.css` de 500 líneas; sin Tailwind ni shadcn | `package.json` |
| Pruebas | 125, casi todas de dominio; 1 sola ruta probada | `npm test` |
| Candados de seguridad en CI | ✅ RLS y permisos por ruta | `src/infrastructure/seguridad.test.ts` |

El esquema de la base **no cambia**: no hay migraciones en este milestone.

## 3. Decisiones tomadas

| # | Asunto | Decisión |
|---|---|---|
| 1 | Alcance | Completo: R0–R6, incluido el frontend |
| 2 | Nivel de SOLID | **Pragmático**: caso de uso y puerto donde hay reglas de negocio; los catálogos simples usan un repositorio genérico. Coherente con la decisión #16 y con ponytail |
| 3 | Red de seguridad | Guion de regresión en el navegador (`docs/R_REGRESION.md`, fase R2) más pruebas de casos de uso con dobles en memoria. Sin Playwright |
| 4 | Funciones nuevas | **Congeladas** mientras dure. Solo arreglos urgentes, que se traen a la rama de integración |
| 5 | Paleta | Clara con azul marino, la actual del CRM, con tres ajustes WCAG. Fuente: `docs/DESIGN.md` |
| 6 | Componentes | Los 15 de la tabla de `docs/DESIGN.md` §"Bibliotecas de componentes": solo Radix, tokens semánticos, sin efectos. Aceternity/Magic UI fuera del CRM |

Se registran como decisión #41 en `docs/contexto/decisiones.md` durante R1.4.

## 4. Arquitectura destino

```
src/domain/                       reglas puras (sin cambios de fondo)
src/application/
  <modulo>/
    puertos.ts                    interfaces que el módulo necesita (pequeñas)
    casos-de-uso.ts               escrituras: reciben actor + entrada validada
    consultas.ts                  lecturas para las páginas
    *.test.ts                     pruebas con dobles en memoria
  compartido/                     puertos transversales: transacción, auditoría,
                                  almacenamiento de archivos, admin de Auth
  testing/                        dobles en memoria reutilizables
src/infrastructure/
  db/repos/<modulo>.ts            adaptadores Drizzle de los puertos del módulo
  contenedor/<modulo>.ts          arma el módulo con sus adaptadores (fábricas)
src/app/api/**/route.ts           HTTP: parsea, autoriza, llama, responde
src/app/(crm)/**/page.tsx         autoriza, lee parámetros, llama a la consulta, pinta
src/components/ui/                primitivas shadcn (R5)
src/lib/utils.ts                  `cn` (R5)
```

**Regla que evita choques entre agentes:** cada módulo tiene sus propios archivos
de puertos, casos de uso, repositorio y contenedor. **No existe un contenedor
central** que todos editen. Lo compartido (`compartido/`, `testing/`, la prueba
de arquitectura) se crea en R1 y después no se toca en paralelo.

**Dónde va el permiso:** `requireScope`/`requireFullScope` sigue en la ruta (lo
exige `seguridad.test.ts`), y el alcance se pasa al caso de uso o a la consulta,
que filtra con `visibleRows`/`reaches` dentro del adaptador. La auditoría se
escribe dentro de la misma transacción, como hoy.

**Nombres de módulo** (coinciden con las carpetas de `src/app/api/` y
`src/app/(crm)/`): `contactos`, `leads`, `pipeline`, `actividades`, `proyectos`,
`usuarios`, `comisiones`, `metas`, `brokers`, `catalogos`, `etapas`, `papelera`,
`roles`.

## 5. Cómo trabajan Claude y Codex sin pisarse

| | Claude | Codex |
|---|---|---|
| Dónde | Carpeta principal del repo, rama `dev/reestructuracion-solid` | Worktree propio: `D:\ViltrumTEK\Quisqueya_Home\crm-codex`, rama `dev/reestructuracion-solid-codex` |
| Qué hace | Fundamentos, piloto, módulos grandes, base de estilos, verificación en el navegador, integración y cierre | Extracción de módulos y migración de vistas |
| Qué puede ejecutar | Todo, incluido `npm run dev` y `build` | `typecheck`, `lint`, `test`. **Nunca `npm run dev` ni `build`** (`errores-conocidos.md`: deja archivos en `.next/` que Windows no deja borrar). **Nunca `git` ni `gh`**: ver abajo |

**Codex no puede usar git ni GitHub** (comprobado el 02/10/2026). Su sandbox solo
escribe dentro de `crm-codex`, y el `.git` de un worktree no es un directorio: es
un puntero a `QuisqueyaHome_CRM_clon-github/.git/worktrees/crm-codex`. Así que
cualquier escritura de git desde el worktree aterriza en el repositorio principal,
fuera de su alcance; hasta un `git merge` falla al escribir `ORIG_HEAD`. Además no
lee la configuración de `gh` (vive en `AppData\Roaming\GitHub CLI\`) ni tiene
aprobadas las mutaciones del conector de GitHub. Darle un clon propio en vez del
worktree arreglaría el merge, pero no el push ni los issues: no resuelve el fondo.

**Flujo de un issue de Codex** (reparto acordado el 02/10/2026):

1. **Claude** pone al día la rama de Codex (`git merge dev/reestructuracion-solid`
   dentro de `../crm-codex`), crea el issue si falta y lo reclama con
   `estado:en-curso`.
2. **Codex** implementa en `../crm-codex` y deja `typecheck`, `lint` y `test` en
   verde. No commitea: deja los cambios en el árbol de trabajo y entrega un informe
   con los archivos que tocó, las decisiones de diseño, lo que encontró y no
   arregló, y un repaso de seguridad de su propio diff.
3. **Claude** revisa ese diff (seguridad incluida), hace el commit por issue y el
   push de `dev/reestructuracion-solid-codex`, y pone el issue en
   `estado:verificar` con el resumen.
4. **Claude** trae la rama (`git merge dev/reestructuracion-solid-codex`), corre el
   guion de regresión del módulo en el navegador y, si pasa, cierra el issue. Si
   falla, comenta el fallo en el issue y lo devuelve a `estado:en-curso`.

Consecuencia: los issues de Codex los crea Claude, no Codex. El paso 3 de la §9 no
se aplica a Codex.

**Preparar el worktree de Codex** (una sola vez, lo hace Claude en R0.1):

```bash
git worktree add ../crm-codex -b dev/reestructuracion-solid-codex dev/reestructuracion-solid
```
Después, dentro de `../crm-codex`: copiar `.env` y correr `npm ci`.

## 6. Etiquetas y orden

Etiquetas del milestone: `reestructuracion`, `agente:claude`, `agente:codex`,
`fase:R0` … `fase:R6`, `estado:en-curso`, `estado:verificar`.

```
R0.1 ─▶ R1.1 ─▶ R1.2 ─▶ R1.3 ─▶ R1.4 ─┬─▶ R3.* (en paralelo por módulo) ─▶ R4.* del mismo módulo ─┐
         R2.1 (Claude, tras R1.3) ─────┘                                                            │
         R5.1 (Claude, tras R1.4) ─────────────────────────────▶ R5.2 … R5.7 (tras el R4 del módulo) ─┴─▶ R5.8 ─▶ R6.1
```

- Un issue solo se empieza cuando todos los de su campo **Depende de** están cerrados.
- R3 y R4 de un **mismo** módulo van en serie (tocan la misma carpeta); de módulos distintos, en paralelo.
- R5.2–R5.7 tocan `vista.tsx` e `inspector.tsx`, que R3/R4 no tocan, pero consumen la forma de datos que R4 deja: por eso esperan al R4 de su módulo.

## 7. Issues

Formato de cada bloque: **Agente** · **Depende de** · **Archivos** (los únicos que
el issue puede modificar, además de sus pruebas) · **Qué hacer** · **Terminado
cuando**. El título del issue en GitHub es la línea `###` sin el `###`.

Toda ruta o página que se migre conserva exactamente su respuesta: mismos códigos
HTTP, mismos mensajes, mismos campos.

### R0.1 · Preparar la rama de integración y el worktree de Codex
- **Agente:** Claude · **Depende de:** — · **Fase:** R0
- **Archivos:** ninguno de código.
- **Qué hacer:** comprobar que existe `dev/reestructuracion-solid` (la crea el usuario desde `dev/jvven`) y que está publicada; abrir el PR en borrador contra `develop` (título "Reestructuración con metodología SOLID", cuerpo con enlace a este documento y `Closes` de los issues al final); crear el worktree de Codex (§5); crear las etiquetas de la §6 si faltan.
- **Terminado cuando:** el PR borrador existe y CI corre en él; `git worktree list` muestra `crm-codex`.

### R1.1 · Prueba de arquitectura por capas
- **Agente:** Claude · **Depende de:** R0.1 · **Fase:** R1
- **Archivos:** `src/infrastructure/arquitectura.test.ts` (nuevo).
- **Qué hacer:** una prueba, en el estilo de `seguridad.test.ts`, que lea los imports de `src/` y falle si: `domain/` importa algo fuera de `domain/`; `application/` importa `infrastructure/`, `app/`, `next`, `drizzle-orm` o `@supabase`; `infrastructure/` importa `app/`. Para `src/app/`: un módulo está **migrado** cuando existe `src/application/<modulo>/`; desde ese momento ningún archivo de `src/app/api/<modulo>/` ni de `src/app/(crm)/<modulo>/` puede importar `@/infrastructure/db/*`. Así la prueba se endurece sola, módulo a módulo, sin una lista compartida que todos editen.
- **Terminado cuando:** pasa hoy; falla si se planta un import prohibido (comprobarlo y quitarlo, como se hizo con `seguridad.test.ts`).

### R1.2 · Puertos compartidos, dobles en memoria y patrón de contenedor
- **Agente:** Claude · **Depende de:** R1.1 · **Fase:** R1
- **Archivos:** `src/application/compartido/*`, `src/application/testing/*`, `src/infrastructure/db/repos/compartido.ts`, `src/infrastructure/contenedor/compartido.ts`.
- **Qué hacer:** puertos para transacción (unidad de trabajo), auditoría, almacenamiento de archivos (fotos de obra) y admin de Auth (invitaciones); sus adaptadores sobre `transaction()`, `auditar()`, Supabase Storage y `adminClient()`; dobles en memoria para pruebas. Contenedor con funciones fábrica simples, sin librería de inyección.
- **Terminado cuando:** hay pruebas de contrato que pasan contra los dobles en memoria; nada de `src/app/` cambia todavía.

### R1.3 · Módulo piloto: Contactos de punta a punta (backend)
- **Agente:** Claude · **Depende de:** R1.2 · **Fase:** R1
- **Archivos:** `src/application/contactos/*`, `src/infrastructure/db/repos/contactos.ts`, `src/infrastructure/contenedor/contactos.ts`, `src/app/api/contactos/**`, `src/app/(crm)/contactos/page.tsx`.
- **Qué hacer:** casos de uso crear, editar y borrar contacto (con la detección de duplicados de la decisión #19); consultas de listado paginado y ficha; adaptador Drizzle con `visibleRows`; ruta y página delgadas. La vista (`vista.tsx`, `inspector.tsx`) no se toca: es de R5.
- **Terminado cuando:** `src/app/**/contactos` ya no importa la base (la prueba de R1.1 lo exige); pruebas de los casos de uso con dobles; flujo de contactos verificado en el navegador como admin y como broker.

### R1.4 · Documentar el patrón
- **Agente:** Claude · **Depende de:** R1.3 · **Fase:** R1
- **Archivos:** `src/application/README.md`, `docs/contexto/arquitectura.md`, `docs/contexto/convenciones.md`, `docs/contexto/decisiones.md`.
- **Qué hacer:** el README de `application/` explica el patrón con Contactos como ejemplo, paso a paso, para que Codex lo replique sin preguntar. Decisión #41 con las seis decisiones de la §3 (actualiza la #16). `arquitectura.md` al día (hoy dice que no hay estilos ni consultas reales). `decisiones.md` solo se amplía: no se reescriben entradas anteriores.
- **Terminado cuando:** alguien que solo lea el README puede migrar un módulo nuevo.

### R2.1 · Guion de regresión por módulo
- **Agente:** Claude · **Depende de:** R1.3 · **Fase:** R2
- **Archivos:** `docs/R_REGRESION.md` (nuevo).
- **Qué hacer:** por cada módulo, los flujos críticos con pasos, rol (admin, asistente, broker) y resultado esperado: crear contacto con duplicado, capturar lead externo, convertir lead, asignar responsable, mover etapa, cerrar negocio (8 pasos), perder negocio, aprobar y pagar comisión, exportar CSV, crear fase de obra, subir foto, invitar usuario, editar permisos, restaurar de la papelera. Ejecutarlo completo una vez sobre el estado actual y anotar el resultado como línea base.
- **Terminado cuando:** el guion existe y tiene una línea base con fecha.

### R3.1 · Pipeline: casos de uso de escritura
- **Agente:** Claude · **Depende de:** R1.4, R2.1 · **Fase:** R3
- **Archivos:** `src/application/pipeline/*`, `src/infrastructure/db/repos/pipeline.ts`, `src/infrastructure/contenedor/pipeline.ts`, `src/app/api/pipeline/**` (incluidos `_cierre.ts` y `_negocio-abierto.ts`).
- **Qué hacer:** mover el cambio de etapa, el cierre transaccional de 8 pasos, la pérdida con motivo y la gestión de propiedades del negocio a casos de uso. Las reglas que ya están en `domain/transicion-etapa.ts` y `domain/cierre-negocio.ts` se reutilizan, no se duplican.
- **Terminado cuando:** las rutas de `api/pipeline` no importan la base; el guion de pipeline pasa en el navegador, incluido el cierre con metas y comisiones.

### R3.2 · Leads: casos de uso de escritura
- **Agente:** Claude · **Depende de:** R1.4, R2.1 · **Fase:** R3
- **Archivos:** `src/application/leads/*`, `src/infrastructure/db/repos/leads.ts`, `src/infrastructure/contenedor/leads.ts`, `src/app/api/leads/**` (incluido `_broker-candidatos.ts`).
- **Qué hacer:** alta, edición, descarte, conversión transaccional, asignación de responsable y la captura externa (webhook con token, idempotente). `leads/externo` sigue en `RUTAS_PUBLICAS` con `coincideToken`.
- **Terminado cuando:** las rutas de `api/leads` no importan la base; el guion de leads pasa, incluida la captura externa repetida (no duplica).

### R3.3 · Actividades: casos de uso de escritura
- **Agente:** Codex · **Depende de:** R1.4, R2.1 · **Fase:** R3
- **Archivos:** `src/application/actividades/*`, `src/infrastructure/db/repos/actividades.ts`, `src/infrastructure/contenedor/actividades.ts`, `src/app/api/actividades/**`.
- **Qué hacer:** crear, editar, completar y borrar actividades; exportación ICS usando `domain/ics.ts`.
- **Terminado cuando:** las rutas no importan la base; `typecheck`, `lint` y `test` en verde; Claude verifica el guion de actividades.

### R3.4 · Proyectos, unidades, fases y fotos: casos de uso de escritura
- **Agente:** Codex · **Depende de:** R1.4, R2.1 · **Fase:** R3
- **Archivos:** `src/application/proyectos/*`, `src/infrastructure/db/repos/proyectos.ts`, `src/infrastructure/contenedor/proyectos.ts`, `src/app/api/proyectos/**` (incluido `_fase.ts`).
- **Qué hacer:** proyectos y unidades (con el precio real restringido por permiso, `stripRestrictedPrices`), fases de obra con recálculo de avance (`domain/avance-obra.ts`), subida y borrado de fotos a través del puerto de almacenamiento de R1.2.
- **Terminado cuando:** las rutas no importan la base; Claude verifica el guion de proyectos y fotos.

### R3.5 · Usuarios, invitaciones y permisos: casos de uso de escritura
- **Agente:** Codex · **Depende de:** R1.4, R2.1 · **Fase:** R3
- **Archivos:** `src/application/usuarios/*`, `src/application/roles/*`, `src/infrastructure/db/repos/usuarios.ts`, `src/infrastructure/db/repos/roles.ts`, `src/infrastructure/contenedor/usuarios.ts`, `src/infrastructure/contenedor/roles.ts`, `src/app/api/usuarios/**`, `src/app/api/roles/**`.
- **Qué hacer:** alta con invitación (puerto de admin de Auth), edición, borrado, reenvío de invitación y matriz de permisos. **Se conservan intactas** las protecciones de seguridad del 29/09: `requireFullScope` y la guarda del último administrador activo, con sus pruebas.
- **Terminado cuando:** las rutas no importan la base; Claude verifica el guion y hace `/security-review` del diff antes de cerrar.

### R3.6 · Comisiones, metas y brokers: casos de uso de escritura
- **Agente:** Codex · **Depende de:** R1.4, R2.1 · **Fase:** R3
- **Archivos:** `src/application/comisiones/*`, `src/application/metas/*`, `src/application/brokers/*`, sus repos y contenedores, `src/app/api/comisiones/**`, `src/app/api/metas/**`, `src/app/api/brokers/**`.
- **Qué hacer:** transiciones de comisión (`domain/comision-estado.ts`), exportación CSV (`domain/csv.ts`), meta mensual (sin tocar `achieved_*`), asignación de proyectos a brokers. `api/metas/route.test.ts` se conserva o se traslada al caso de uso.
- **Terminado cuando:** las rutas no importan la base; Claude verifica el guion.

### R3.7 · Catálogos, etapas y papelera con repositorio genérico
- **Agente:** Codex · **Depende de:** R1.4, R2.1 · **Fase:** R3
- **Archivos:** `src/application/catalogos/*`, `src/application/etapas/*`, `src/application/papelera/*`, sus repos y contenedores, `src/app/api/catalogos/**`, `src/app/api/etapas/**`, `src/app/api/papelera/**`.
- **Qué hacer:** decisión 2 (pragmático): un repositorio genérico para las tablas de catálogo y la papelera, sin un caso de uso por tabla.
- **Terminado cuando:** las rutas no importan la base; Claude verifica el guion.

### R4.1 · Consultas de lectura: pipeline, leads, agenda y tareas
- **Agente:** Codex · **Depende de:** R3.1, R3.2, R3.3 · **Fase:** R4
- **Archivos:** `src/application/{pipeline,leads,actividades}/consultas.ts`, sus repos, `src/app/(crm)/{pipeline,leads,agenda,tareas}/page.tsx`.
- **Qué hacer:** sacar de las páginas las consultas SQL a `consultas.ts`, conservando filtros, paginación y alcance. Agenda y tareas leen de `actividades`.
- **Terminado cuando:** esas páginas no importan la base; Claude verifica que muestran lo mismo que antes, como admin y como broker.

### R4.2 · Consultas de lectura: propiedades y avances de obra
- **Agente:** Codex · **Depende de:** R3.4 · **Fase:** R4
- **Archivos:** `src/application/proyectos/consultas.ts`, su repo, `src/app/(crm)/propiedades/**`, `src/app/(crm)/avances/**` (solo las partes que leen datos; los componentes visuales son de R5).
- **Qué hacer:** igual que R4.1. `propiedades/[slug]/vista.tsx`, `_formulario-proyecto.tsx` y `avances/vista.tsx` importan el esquema: pasar esos tipos a tipos propios de la consulta.
- **Terminado cuando:** nada bajo `(crm)/propiedades` ni `(crm)/avances` importa la base; Claude verifica.

### R4.3 · Consultas de lectura: brokers, metas, comisiones, configuración e historial
- **Agente:** Codex · **Depende de:** R3.5, R3.6, R3.7 · **Fase:** R4
- **Archivos:** `consultas.ts` de `brokers`, `metas`, `comisiones`, `usuarios`, `roles`, `catalogos`, `etapas`, `papelera`; `src/app/(crm)/{brokers,metas,comisiones,configuracion}/**` (partes de datos), `src/app/(crm)/comisiones/_consulta.ts`, `src/app/(crm)/_ui/historial.tsx`.
- **Qué hacer:** igual que R4.1. El historial de auditoría pasa a una consulta compartida.
- **Terminado cuando:** ningún archivo de `src/app/` importa `@/infrastructure/db/*`; Claude verifica.

### R5.1 · Base del sistema de diseño: Tailwind v4, shadcn/ui y shell
- **Agente:** Claude · **Depende de:** R1.4 · **Fase:** R5
- **Archivos:** `package.json`, `postcss.config.mjs`, `components.json`, `src/lib/utils.ts`, `src/components/ui/*`, `src/app/layout.tsx`, `src/app/(crm)/layout.tsx`, `src/app/(crm)/nav-link.tsx`, `src/app/(crm)/logout-button.tsx`, un CSS nuevo de tokens, y un cliente de API tipado compartido para las vistas.
- **Qué hacer:** instalar Tailwind CSS v4 **sin su reseteo global** (preflight) para no alterar las vistas no migradas; `shadcn init`; traducir `docs/DESIGN.md` a variables de shadcn tal como indica su tabla; `lucide-react`, `motion` y `sonner`; primitivas base de shadcn; migrar el shell (barra lateral y cabecera) con el `Sidebar` de shadcn y `collapsible-05`. Cliente de API tipado que sustituya los `fetch('/api…')` sueltos.
- **Terminado cuando:** el shell se ve con la paleta de `DESIGN.md` y las vistas sin migrar se ven igual que antes; contraste verificado.

### R5.2 · Vistas de contactos y leads
- **Agente:** Codex · **Depende de:** R5.1, R4.1 · **Fase:** R5
- **Archivos:** `src/app/(crm)/contactos/{vista,inspector,loading,error}.tsx`, `src/app/(crm)/leads/{vista,inspector,loading,error}.tsx`.
- **Qué hacer:** tabla con `table-20`, cabecera con `page-header-5`, inspector con `Sheet`, estados vacíos, avisos con Sonner. Dividir vistas grandes en componentes y hooks.
- **Terminado cuando:** Claude verifica en el navegador el guion y el aspecto contra `DESIGN.md`.

### R5.3 · Vista de pipeline
- **Agente:** Codex · **Depende de:** R5.1, R4.1 · **Fase:** R5
- **Archivos:** `src/app/(crm)/pipeline/{vista,inspector,loading,error}.tsx`.
- **Qué hacer:** kanban con `diceui/kanban` (arrastre accesible por teclado), inspector con `Sheet`, animación de cambio de etapa según §Movimiento de `DESIGN.md`.
- **Terminado cuando:** Claude verifica mover, cerrar y perder un negocio en el navegador, con ratón y con teclado.

### R5.4 · Vistas de agenda, tareas, inicio y reportes
- **Agente:** Codex · **Depende de:** R5.1, R4.1 · **Fase:** R5
- **Archivos:** `src/app/(crm)/{agenda,tareas,inicio,reportes}/vista.tsx`.
- **Qué hacer:** la agenda semanal conserva su diseño actual pasado a tokens (no hay componente de 21st que cumpla); KPI con `progress-metric-card`; gráficos con `charts-1`. Inicio y reportes siguen con datos de muestra: solo cambia la capa visual.
- **Terminado cuando:** Claude verifica.

### R5.5 · Vistas de propiedades y avances de obra
- **Agente:** Codex · **Depende de:** R5.1, R4.2 · **Fase:** R5
- **Archivos:** `src/app/(crm)/propiedades/**` y `src/app/(crm)/avances/**` (partes visuales).
- **Qué hacer:** subida de fotos con `file-dropzone`, timeline de obra con `timeline-3`, formularios con los campos de Origin UI.
- **Terminado cuando:** Claude verifica crear fase y subir foto.

### R5.6 · Vistas de brokers, metas y comisiones
- **Agente:** Codex · **Depende de:** R5.1, R4.3 · **Fase:** R5
- **Archivos:** `src/app/(crm)/{brokers,metas,comisiones}/**` (partes visuales).
- **Qué hacer:** KPI y gráficos según `DESIGN.md`; estados de comisión con insignias semánticas.
- **Terminado cuando:** Claude verifica.

### R5.7 · Configuración, academy, comunicaciones y acceso
- **Agente:** Codex · **Depende de:** R5.1, R4.3 · **Fase:** R5
- **Archivos:** `src/app/(crm)/configuracion/**`, `src/app/(crm)/{academy,comunicaciones}/vista.tsx`, `src/app/login/*`, `src/app/recuperar/*`, `src/app/forbidden.tsx`, `src/app/(crm)/error.tsx`, `src/app/(crm)/loading.tsx`.
- **Qué hacer:** pestañas de configuración con `tabs` de Origin UI; matriz de permisos; login y recuperación. El login conserva el arreglo de redirección del 29/09 (`destino` solo acepta rutas internas).
- **Terminado cuando:** Claude verifica, incluido el login con un `destino` externo, que debe terminar en `/inicio`.

### R5.8 · Retirar globals.css y activar el reseteo de Tailwind
- **Agente:** Claude · **Depende de:** R5.2, R5.3, R5.4, R5.5, R5.6, R5.7 · **Fase:** R5
- **Archivos:** `src/app/globals.css` (se elimina), `src/app/(crm)/_ui/*`, el CSS de tokens.
- **Qué hacer:** borrar las clases que ya nadie usa, activar el reseteo de Tailwind, eliminar `_ui/prototipo-ui.tsx` y `_ui/datos-muestra.ts` si ya no tienen consumidores.
- **Terminado cuando:** recorrido visual completo sin regresiones; contraste y foco verificados según §Accesibilidad de `DESIGN.md`.

### R6.1 · Cierre, revisión y PR a develop
- **Agente:** Claude · **Depende de:** R4.3, R5.8 · **Fase:** R6
- **Archivos:** `docs/contexto/*`, `docs/R_ESTADO.md` (nuevo).
- **Qué hacer:** la prueba de arquitectura en modo estricto para todo `src/app/`; `/ponytail-audit`, `/ponytail-debt` y `/security-review` sobre el diff completo; guion de regresión entero contra la línea base de R2.1; documentos de contexto al día; `R_ESTADO.md` con lo verificado; sacar el PR de borrador.
- **Terminado cuando:** `typecheck`, `lint`, `test` y `build` en verde, guion completo pasado y el PR listo para revisión.

## 8. Cuándo está terminada la reestructuración

1. Ningún archivo de `src/app/` importa `@/infrastructure/db/*`, y una prueba lo impide.
2. `src/application/` contiene los casos de uso y consultas de los 13 módulos, con pruebas que no necesitan base de datos.
3. El guion de regresión completo da el mismo resultado que la línea base de R2.1.
4. Las pruebas de seguridad (`seguridad.test.ts`) siguen en verde y `/security-review` no encuentra hallazgos nuevos.
5. El CRM se ve con la paleta de `docs/DESIGN.md`, con Tailwind y shadcn, y `globals.css` ya no existe.
6. Contraste WCAG AA y foco visible verificados.
7. `typecheck`, `lint`, `test` y `build` en verde.
8. Documentos de contexto al día.

## 9. Cómo arranca una sesión

La frase del usuario es: *"Trabaja en el milestone 'Reestructuración con metodología SOLID': crea las issues que te corresponden y ponte a trabajar."*

1. **Identificarse:** Claude o Codex. Lo que sigue se refiere solo a los issues de tu etiqueta `agente:`.
2. **Leer** este documento, `AGENTS.md`, `docs/DESIGN.md` si el trabajo es visual, y `src/application/README.md` si ya existe (lo deja R1.4).
3. **Crear los issues que falten**, uno por cada bloque `### R…` de la §7 con tu agente. Antes de crear, buscar si ya existe:
   ```bash
   gh issue list --milestone "Reestructuración con metodología SOLID" --state all --search "R3.3 in:title"
   ```
   El cuerpo del issue es el bloque completo, más un enlace a este documento. Etiquetas: `reestructuracion`, `agente:<tú>`, `fase:R<n>`.
4. **Elegir el siguiente:** el de número más bajo entre los tuyos que esté abierto, sin `estado:en-curso` ni `estado:verificar`, y con todas sus dependencias cerradas. Si ninguno está listo, decirlo y parar: no adelantarse.
5. **Reclamarlo:** etiqueta `estado:en-curso` y un comentario de inicio.
6. **Trabajar** en tu carpeta y rama (§5), dentro de los **Archivos** del issue. Si hace falta tocar un archivo fuera de esa lista, parar y comentarlo en el issue.
7. **Cerrar:** un commit por issue en Conventional Commits (`refactor(R3.3): …`), pruebas en verde, push. Si eres Claude, verificar en el navegador y cerrar el issue. Si eres Codex, poner `estado:verificar` y comentar qué cambió y qué debe comprobar Claude.
8. **Seguir** con el siguiente, hasta que no quede ninguno listo.

## 10. Lo que este milestone deliberadamente no hace

- **Funciones nuevas**, aunque se vean fáciles al pasar por el código (decisión 4).
- **Cambios de esquema o migraciones.**
- **Datos reales en inicio, reportes, academy y comunicaciones**: siguen con datos de muestra; solo cambia su capa visual.
- **El portal público**, ni los componentes de marketing de 21st.
- **Despliegue al VPS** (decisión #17, sigue aplazado).
