# Expediente de evolución · Automatizaciones (reglas y flujos entre módulos)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026) · G4 Plataforma · D21 + D03 + D12 · 2026-10-14.
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia); AGPL/GPL solo como servicio aparte o referencia. Nada se incrusta.
> Diseño transversal: `G4-00-arquitectura-centralizacion.md`. Las automatizaciones son un **consumidor del bus** que ejecuta acciones permitidas; no hablan directo con ningún módulo.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 0 | No existe código de reglas, disparadores ni acciones programadas. En el catálogo previo figuran como brechas (`MAPA-SISTEMAS-OSS.md` §3: «Automatización — workflows de Twenty primero; Activepieces si hace falta»), ambos sin instalar. |
| Datos reales y reglas de negocio | 0 | Sin tablas. Reglas fijas dispersas en código: asignación de lead (`domain/asignacion-lead.ts`), transiciones de etapa (`transicion-etapa.ts`), caducidad de propuestas (#47). |
| Diseño y componentes | 0 | — |
| Experiencia de uso | 0 | Las tareas de seguimiento se crean a mano (`api/actividades`); no hay recordatorio de primer contacto (inventario D21: «no se encontró SLA ni recordatorio de primer contacto»). |
| Calidad | 0 | — |

## 2. Puntos críticos (decidir antes de construir)
1. **Dónde vive el motor**: Twenty no está en uso (CRM local es el dueño de los datos, decisión #43) y es AGPL; sus workflows no son una opción para un CRM que corre sin Twenty. n8n está descartado por licencia (Sustainable Use, `MAPA-SISTEMAS-OSS.md` §2). Queda: motor propio mínimo + Activepieces solo para integraciones con SaaS externos.
2. **Seguridad de ejecución**: una automatización que corre con permisos amplios es una escalada de privilegios programable. La regla ejecuta **con los permisos de quien la creó (instantánea al guardar) y nunca más**, y las acciones peligrosas pasan por aprobación (G4-auditoria-aprobaciones).
3. **Bucles**: un evento provoca una acción que emite otro evento que dispara la misma regla. Sin `causationId` y profundidad máxima el sistema se auto-inunda. El sobre del evento ya lo prevé (G4-00 §2).
4. **Mensajes a clientes**: una regla que envíe WhatsApp automáticamente toca consentimiento (`contacts.consent_at`, `schema.ts:582-583`) y el despacho exige permiso real (corregido el 14-oct). La acción «enviar plantilla» debe verificar consentimiento y quedar auditada.
5. **Requisito previo**: no puede haber automatizaciones sin el bus con fan-out y sin tipos filtrados (G4-bus-eventos-integraciones BUS-02/03); hoy un evento de tipo nuevo mata el mensaje.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| AUT-01 | Motor de reglas «cuando (evento) · si (condiciones) · entonces (acciones)» con ejecución idempotente por (regla, evento) | ESENCIAL | A21.3 | ausente |
| AUT-02 | Acciones permitidas (lista blanca): crear tarea, notificar, asignar responsable (con aprobación si el actor es asistente), etiquetar, cambiar estado de lead, enviar plantilla de mensaje (con consentimiento), llamar webhook firmado | ESENCIAL | A1, A2 | ausente |
| AUT-03 | Disparadores programados: «X horas después de…», «cada lunes 8:00», «sin actividad N días» | ESENCIAL | A1.4, A2 | ausente |
| AUT-04 | Biblioteca de plantillas de regla listas para activar (SLA de primer contacto, lead sin seguimiento, cuota por vencer, KYC por caducar, unidad vendida → retirar del portal, avance publicado → avisar) | ESENCIAL | A2, A7, A17.3 | ausente |
| AUT-05 | Simulación («qué habría pasado con los últimos 30 días») y modo prueba que ejecuta sin efectos | IMPORTANTE | A21.3 | ausente |
| AUT-06 | Registro de ejecuciones con resultado, motivo de omisión, duración; reintento y desactivación automática tras N fallos | ESENCIAL | A21.3 | ausente |
| AUT-07 | Protecciones: profundidad máxima 3 por `causationId`, límite por regla/hora, interruptor general por rol Admin | ESENCIAL | A19 | ausente |
| AUT-08 | Constructor visual de flujos con ramas (DESEABLE; v1 es formulario) | DESEABLE | A21.3 | ausente |
| AUT-09 | Puente a SaaS externos (Google Sheets, Slack, correo masivo) mediante Activepieces como servicio aparte | DESEABLE | A21.3 | ausente |
| AUT-10 | Versionado de reglas con quién y cuándo, y aprobación de cambios en reglas críticas | IMPORTANTE | A19.2 | ausente |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **GoRules Zen** | `gorules/zen` @ `c8a7d89a6b`, npm `@gorules/zen-engine` 2.1.7 (modificado 2026-10-13) | MIT (`LICENSE` leído, © GoRules.io) | Rust con binding Node (`createDecision`) | Evaluación de **condiciones y tablas de decisión** (JDM) para el «si» de las reglas; mismo motor que ya se eligió para cotizaciones (`ReglasPort`, E2.4) | **APP** tras `ReglasPort` | Una sola librería de reglas para precios, comisiones y automatizaciones. Binario nativo en Windows/Node 22: **NO VERIFICADO**; si falla, el «si» se implementa con un evaluador propio de ~10 operadores (eq, in, gt, between, contains, exists, olderThan…) | M |
| json-rules-engine | `CacheControl/json-rules-engine` @ `e1f1fda81b`, última publicación npm 2025-02-20 | ISC | JS puro | condiciones `all/any` serializables en JSON | **REF/alternativa** | Sin dependencia nativa pero poco mantenimiento (último push 2026-02-16). Solo si Zen falla en Windows | S |
| **pg-boss** (ver G4-bus) | `timgit/pg-boss` @ `b53278b0af`, 12.38.0 | MIT | TS | `schedule()` cron/RRULE para los disparadores programados y entrega de acciones con reintento y DLQ | **APP** | Mismo motor del bus | S |
| xstate | `statelyai/xstate` @ `858273e52d` | MIT | TS | máquinas de estado para flujos con espera (ej. «enviar → esperar respuesta 48 h → escalar») | REF (AUT-08) | Solo si aparecen flujos con espera larga | M |
| `@xyflow/react` (React Flow) | `xyflow/xyflow` @ `3d35b57317` | MIT (`LICENSE` leído, © webkid GmbH) | React | lienzo de nodos y aristas para el constructor visual | **APP** (AUT-08, DESEABLE) | Encaja con shadcn/Tailwind; esfuerzo alto para UX accesible | L |
| **Activepieces** | `activepieces/activepieces` @ `85a8cd9390` | **MIT** salvo `packages/ee` y `packages/server/api/src/app/ee` bajo licencia comercial (`LICENSE` leído) | TS (NestJS + React), Postgres + Redis | Constructor de flujos con cientos de «piezas» (Sheets, Slack, Gmail…) | **RUN aparte** (AUT-09), nunca embebido | Su propia documentación indica que el **embebido es solo del plan Enterprise** (docs.activepieces.com «Embedding», consultada hoy): mostrar su constructor dentro del CRM no es posible con la edición MIT. Como servicio aparte recibe webhooks firmados del CRM y llama a la API con token; evitar `ee` | M |
| Vercel Workflow | `vercel/workflow` @ `59b76f8dea` | Apache-2.0 | TS | flujos durables con `"use workflow"` | REF | Diseñado para su plataforma; adaptador a Postgres local **NO VERIFICADO** | — |
| n8n | — | Sustainable Use License (no OSI) | — | — | **DESCARTADO** | Ya descartado en `MAPA-SISTEMAS-OSS.md` §2 | — |

Qué adaptamos: Zen para el «si», pg-boss para el «cuándo», registro de acciones propio para el «entonces» (cada acción es un caso de uso existente invocado con el actor delegado). Qué no: Activepieces dentro del producto, ni Twenty workflows. Riesgos: dependencia nativa de Zen en Windows; explosión de reglas mal escritas (mitigado por simulación, límites y aprobación).

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Lista de automatizaciones con interruptor, última ejecución y tasa de éxito | `data-table.tsx` + `Switch` + `Badge` | módulo nuevo `/automatizaciones` (recurso `automations`) |
| Editor «Cuando / Si / Entonces» en tres bloques con vista previa en lenguaje natural | `Card` + `Select` + `Input` + `Popover` de campos | ídem |
| Simulación con tabla «hubiera ejecutado / omitido por…» | `Sheet` + `Table` | ídem |
| Registro de ejecuciones con enlace a la entidad y al evento | `data-table.tsx` | ídem |
| Plantillas de regla (galería con «Activar») | `Card` en cuadrícula | ídem |

## 6. Comunicación con el resto (centralización)
**Consume**: cualquier evento del catálogo (G4-00 §3) más los programados. **Emite**: `AutomatizacionEjecutada`, `AutomatizacionFallida` (métrica) y los eventos de las acciones que invoca (cada acción es un caso de uso que ya emite lo suyo, con `causationId`). **Puertos**: `ReglasPort` (Zen o evaluador propio), `ProgramadorPort` (pg-boss), `NotificacionesPort`, `MensajeriaPort`, `AprobacionesPort`, casos de uso de Leads/Tareas/Negocios. **Datos compartidos**: `automation_rules` (id, nombre, activa, evento, condiciones jsonb validadas con Zod, acciones jsonb, `creada_por`, `permisos_snapshot`, versión) y `automation_runs` (regla, evento, estado, motivo, `UNIQUE(regla, evento)`).

## 7. Lotes asignables
Ficha nueva: `G08-automatizaciones` (D01/D03; D12 obligatoria por escalada de privilegios y mensajes a clientes). Dependen del bus (BUS-L4 y BUS-L10).
| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| AUT-L1 | PoC de `@gorules/zen-engine` en Windows/Node 22 con 5 condiciones de ejemplo y su equivalente en evaluador propio; informe | `scripts/poc-zen.mjs` (nuevo), `.viltrum/vre-os/evidencia/` | G08 | Sonnet | D03 | — |
| AUT-L2 | Dominio puro: tipos `Regla`, `Condicion`, `Accion`, validación Zod, evaluación, profundidad y límites; tabla de verdad | `src/domain/automatizaciones.ts` (+test) | G08 | Sonnet | D14 | AUT-L1 |
| AUT-L3 | Migración `automation_rules`, `automation_runs` (RLS, UNIQUE) | `schema.ts`, `drizzle/0006_*`, `scripts/test-db/**` | G08 + D11 | Sonnet | D11+D12 | AUT-L2 |
| AUT-L4 | Casos de uso crear/editar/activar/simular con `permisos_snapshot` y auditoría | `src/application/automatizaciones/**` | G08 | Sonnet | D12 | AUT-L3 |
| AUT-L5 | Consumidor del bus: evalúa, ejecuta acciones con el actor delegado, registra `automation_runs`, corta bucles por `causationId` | `src/infrastructure/integraciones/automatizaciones/**` | G08 + G10 | Sonnet | D12 | AUT-L4 + BUS-L4 |
| AUT-L6 | Acciones iniciales: `crearTarea`, `notificar`, `etiquetar`; cada una con prueba de permiso insuficiente | `src/application/automatizaciones/acciones/**` | G08 | Sonnet | D12 | AUT-L5 |
| AUT-L7 | Acción `enviarPlantilla` con verificación de consentimiento y aprobación obligatoria la primera vez | ídem + `src/application/comunicaciones/**` (solo uso) | G08 + M11 | Sonnet | D12 | AUT-L6 |
| AUT-L8 | Disparadores programados con `ProgramadorPort` («N horas después de», «sin actividad N días») | `src/infrastructure/integraciones/bus/tareas/automatizaciones.ts` | G08 | Sonnet | D14 | BUS-L10 |
| AUT-L9 | Pantalla de lista, editor de tres bloques y registro de ejecuciones (seis estados) | `src/app/(crm)/automatizaciones/**` | G08 | Sonnet | D05+D07 | AUT-L5 |
| AUT-L10 | Simulación sobre histórico + biblioteca de 6 plantillas de regla | `src/application/automatizaciones/simulacion.ts`, `automatizaciones/_plantillas.ts` | G08 | Sonnet | D14 | AUT-L9 |
| AUT-L11 | (DESEABLE) Servicio Activepieces local y webhook saliente firmado hacia él, con guía para el admin | `docs/ops/`, `src/infrastructure/integraciones/webhooks-salida/**` | G08 | Sonnet | D12+D16 | BUS-L11 |

## 8. No verificado
Binario nativo de Zen en este Windows; nombre exacto de la API de evaluación de expresiones (el README del binding solo muestra `createDecision`); requisitos de memoria de Activepieces en el equipo de Wilber; estado de las políticas de consentimiento de WhatsApp (Meta) para mensajes iniciados por la empresa: no investigado; el aviso de ley de protección de datos dominicana (172-13) no se analizó aquí.
