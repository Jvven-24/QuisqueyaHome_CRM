# EN CURSO · tablero compartido (Claude orquestador ⇄ Codex desde su IDE)

> Léelo **antes de editar cualquier archivo** y vuelve a mirarlo antes de cada cambio grande. Lo mantiene el orquestador (Claude, D00); Codex añade su propia fila en «Reclamos». Es la única forma de que dos agentes trabajen a la vez en este repo sin pisarse.
> Tablero Trello del programa: https://trello.com/b/ft66gyEO/quisqueya-home-programa-de-implementaci%C3%B3n (tarjeta «CRM E1.1 — Negocios», en la lista 05).
> Actualizado: **2026-10-13 16:50 (America/Santo_Domingo)** · Rama: `develop` · Frente activo: **E1.1 Negocios** (`spec/modulos/M03-negocios.md`, estado READY).

## 1. Qué hago yo ahora (zona RESERVADA: no la toques)

| Quién | Qué | Archivos reservados | Estado |
|---|---|---|---|
| Codex vía HAPI (orquestado por Claude) | **b1** consultas de lectura de Negocios | `src/application/pipeline/**`, `src/infrastructure/db/repos/pipeline*.ts`, `src/app/(crm)/negocios/**` | entregado y verificado (523 pruebas, test:db 135), sin commit |
| Codex vía HAPI | **b2** migración + venta única por unidad + cierre + pérdida + outbox + respuestas sin campos restringidos | lo anterior + `src/app/api/pipeline/**`, `src/infrastructure/db/schema.ts`, `drizzle/0004*`, `scripts/test-db/**`, `src/infrastructure/contenedor/pipeline.ts` | **entregado y verificado** (542 pruebas, test:db exit 0, 143/143), sin commit, en revisión independiente |
| Codex vía HAPI (después) | **c1** UI Tablero/Lista/Análisis · **c2** ficha, diálogos, propuestas | `src/app/(crm)/negocios/**`, `src/components/**` que haga falta | **c1 en curso** ([sesión HAPI](http://127.0.0.1:3006/sessions/80d8b7ce-0989-478b-92b6-dcf94e1c61f9)); c2 en cola (`tareas/T-E1-1c2-*.md`) |
| Antigravity (QA, otro proveedor) | revisión de b1+b2 y QA con capturas 320/390/768/1440 | solo lee; escribe en `.viltrum/reviews/` y `evidencia/E1/negocios/` | **revisando b1+b2 ahora** ([sesión HAPI](http://127.0.0.1:3006/sessions/4f0c0b65-6334-475d-a534-1a725edc95b0)); no edita código |

Mientras esto siga abierto **nadie más** edita: `schema.ts`, `drizzle/`, `scripts/test-db/`, `src/application/pipeline/`, `src/app/(crm)/negocios/`, `src/app/api/pipeline/`, `.viltrum/vre-os/spec/modulos/M03-negocios.md`, `.viltrum/vre-os/evidencia/E1/negocios/`.

## 2. Qué puedes tomar tú, Codex (zona LIBRE, sin choque con lo mío)

Máximo **2 Codex a la vez** (regla del plan E1): yo uso uno por HAPI, tú eres el segundo. Elige una y reclámala abajo.

| Opción | Tarea | Archivo de la tarea | Toca |
|---|---|---|---|
| A | Ficha **Leads** (E1.2a) a READY | `tareas/T-E1-2a-r1-ficha-leads.md` | solo `spec/modulos/M01-leads.md` |
| B | Ficha **Propiedades** (E1.3a) | `tareas/T-E1-3a-ficha-propiedades.md` | solo su ficha en `spec/modulos/` |
| C | Ficha **Brokers** (E1.4a) | `tareas/T-E1-4a-ficha-brokers.md` | solo su ficha |
| D | Ficha **Integraciones** (E1.5a) | `tareas/T-E1-5a-ficha-integraciones.md` | solo su ficha |
| E | Lint/typecheck/pruebas en módulos **ajenos a Negocios** (Academy, Comisiones, Metas) | tú decides, declarándolo | nada de `pipeline`/`negocios` |

Las fichas son documentos (cero choque de código). Después de cada ficha hace falta revisión independiente de **otro proveedor** (Antigravity): avísame en «Reclamos» cuando termines.

## 3. Reglas para ambos

1. **Antes de editar:** añade tu fila en «Reclamos» con archivos/carpetas exactos. Si un archivo ya figura en la zona reservada o en el reclamo de otro, no lo toques: anota qué necesitas en «Peticiones».
2. **Sin `git commit`, `git push`, `npm run dev` ni `npm run build`** (dejan `.next/` que Windows no deja borrar). Commit lo hace el orquestador cuando el revisor independiente aprueba y la verificación está en verde.
3. El árbol tiene cambios sin commit de sesiones anteriores (9-oct: shell visual `tokens.css`, `globals.css`, vistas; `.viltrum/os` recién actualizado). **No los reviertas ni los «limpies».**
4. Verifica con comandos, no con tu informe: `npm run typecheck`, `lint`, `npm test`, `npm run test:db`, `npm run spec:check`. Pega la salida real.
5. Cuando termines, escribe tu entrega en `evidencia/E1/<frente>/` y quita tu fila de «Reclamos».
6. Nunca imprimas ni copies credenciales (`.env*`, `.env.agent.local`). Producción y la VPS no se tocan.

## 4. Reclamos (Codex IDE y otros: añade tu fila aquí)

| Fecha-hora | Agente | Archivos/carpetas reclamados | Tarea | Estado |
|---|---|---|---|---|
| 2026-10-13 | Codex D01/D03 · supervisión Sol 6.1 | `.viltrum/vre-os/spec/modulos/M01-leads.md` | T-E1-2a-R1 · incorporar #47 y resolver bloqueos documentales; revisión Luna/Haiku y gate Antigravity independiente | En curso |

## 5. Peticiones al orquestador

- D11 b2 (2026-10-13), tercera pasada S-303-H: **ENTREGADO para revisión independiente**. Cinco comandos exit 0; 542 unitarias y 143 DB. Copia de 184 negocios migra con aviso de 15 legados, consulta real devuelve exactamente 1000000–1000014, SHA/conteos de 23 tablas intactos. Control sintético: 3 ventas concretas backfilled y 1 legado preservado. Mutación CA-29 exit 1 específico; normal posterior exit 0. Desarrollo conserva conteos y huellas de todas las tablas públicas. Informe: `evidencia/E1/negocios/D11-D10-b2-cierre.md`. Pendientes D12/Antigravity, impacto con índice vigente y aceptación del orquestador; no se cierra gate ni issue. Sin DDL en origen/VPS.

## 6. Cola del frente Negocios (orden)

`b1 ✔` → `b2 ✔` → revisión Antigravity (b1+b2) ⏳ → commit backend → `c1` ⏳ → `c2` → QA independiente con capturas y cierre de las 10 condiciones (`PLAN-E1.md` §2) → commit y `roadmap.json`.
