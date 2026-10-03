---
plantilla: raci
id: RACI-nnn
proyecto: <id del proyecto>
departamento_dueno: D00
revisor: human            # registro: D00 → human
aprobador_humano:         # persona que aprueba este RACI (normalmente el dueño de producto). Vacío hasta que la persona apruebe; nunca lo rellena un agente
fase: F0                  # se abre en F0 y se revisa al abrir cada fase
gate: G0                  # "preguntas y responsables asignados"; cada puerta posterior comprueba su fila
estado: borrador          # borrador · en_revision · aprobado · rechazado · superado
version: 0.1.0            # del documento; 1.0.0 = primera versión aprobada
fecha: AAAA-MM-DD
riesgo: R<n>
---

# RACI-nnn · Responsabilidades por entregable — <proyecto>

> Quién hace, quién responde, a quién se consulta y a quién se informa de cada entregable.
> La columna **A es siempre una persona**. Los agentes (departamentos Dxx) solo pueden ser
> **R**, **C** o **I**: un agente puede producir y proponer, pero no rinde cuentas ni
> aprueba. D00 coordina y no produce los entregables de producto.

## 0. Reglas

1. Cada entregable tiene exactamente una A.
2. La A es una persona nombrada con rol (`PER-nnn`, §1); nunca un departamento, un agente ni un equipo.
3. Los agentes solo son R, C o I. Nunca A.
4. R es quien produce y puede haber varios. La revisión independiente (columna "Revisa") no puede ser un R de la misma fila (P4).
5. La A no delega la rendición de cuentas; puede delegar la ejecución en los R.
6. Un rol sin persona nombrada deja sin A a los entregables que dependen de él: no se abre la fase.
7. Una decisión contenciosa entre departamentos, de riesgo alto o con presupuesto usa además DACI (§4).
8. Comprobación mecánica con el documento completo: cada celda de la columna `A (persona)` coincide con `^PER-\d{3}$` y ninguna coincide con `D\d{2}`.

## 1. Personas

| ID | Nombre | Rol en el proyecto | Autoridad (qué puede aprobar) | Suplente (`PER-nnn`) | Contacto |
|---|---|---|---|---|---|
| PER-001 | | Dueño de producto | Alcance, aceptación de entregables y de riesgo residual de producto, comunicación externa | | |
| PER-002 | | Autoridad comercial (C1) | Aceptación comercial antes de construir | | |
| PER-003 | | Líder técnico | Arquitectura, decisiones técnicas, plan de pruebas | | |
| PER-004 | | Responsable de seguridad o del riesgo | Aceptación del riesgo residual de seguridad y privacidad | | |
| PER-005 | | Responsable de operaciones (SRE) | Despliegue a producción, runbooks, acciones operativas con aprobación | | |
| PER-006 | | Líder de ingeniería | Aprobación de postmortems y de sus plazos | | |
| PER-007 | | Líder de soporte | Preparación de soporte y escalamiento | | |
| PER-008 | | Asesor legal o de privacidad | Dictamen legal; los agentes no interpretan la ley | | |

## 2. RACI por entregable

| Entregable | Plantilla | Fase · Puerta | R (departamentos que producen) | A: rol requerido | A (persona) | C | I | Revisa (independiente, registro) | Punto de aprobación humana |
|---|---|---|---|---|---|---|---|---|---|
| Mandato | `templates/mandate.md` | F0 · G0 | D00 | Dueño de producto | PER-nnn | D01 · D03 | departamentos activados | humano | — |
| Aceptación comercial | `.viltrum/commercial.md` | C1 | D02 (prepara) | Autoridad comercial | PER-nnn | D00 (custodio) · D03 (estimación) | D09 · D10 · D11 · D16 | humano con autoridad comercial | Aceptación comercial antes de construir |
| Expediente de investigación | `templates/research-dossier.md` | F2 · G2 | D21 | Líder técnico | PER-nnn | D03 · D12 | D02 | D03 | — |
| PRD | `templates/prd.md` | F1 · G1 | D01 · D02 | Dueño de producto | PER-nnn | D03 · D14 · D12 · D08 | D00 | D02 (lo de D01) · D01 (lo de D02) | Aceptación como base de alcance |
| RFC | `templates/rfc.md` | F2 · G2 | D03 | Líder técnico | PER-nnn | D11 · D12 · D16 · D17 · D21 | D09 · D10 | humano | Decisión de diseño |
| ADR | `templates/adr.md` | F2 · G2 | D03 | Líder técnico | PER-nnn | D11 · D12 | D20 | humano | Arquitectura irreversible |
| Modelo de amenazas | `templates/threat-model.md` | F2 · G2 | D12 | Responsable de seguridad o del riesgo | PER-nnn | D03 · D11 · D16 · D14 | D00 | humano | Riesgo residual de seguridad y privacidad |
| Plan de pruebas | `templates/test-plan.md` | F5 · G5 | D14 | Líder técnico | PER-nnn | D01 · D12 · D15 · D07 | D09 · D10 | D00 | Aceptación del plan y de lo excluido |
| Informe de cierre de pruebas | `templates/test-closure-report.md` | F5 · G5 | D14 | Dueño de producto | PER-nnn | D12 · D15 · D07 · D06 | D16 | D00 | Riesgo residual de producto |
| Go / No-Go: decisión de negocio | `templates/go-no-go.md` §2 y §4 | F6 · G6 | D02 · D16 | Dueño de producto | PER-nnn | D14 · D12 · D17 · D20 | soporte | D01 (§4) · D12 (§3, §5–§7) | Go de negocio |
| Go / No-Go: despliegue a producción | `templates/go-no-go.md` §2 (A4) | F6 · G6 | D16 | Responsable de operaciones | PER-nnn | D12 · D17 · D11 | D20 · soporte | D12 | Despliegue a producción y migraciones |
| Runbook operativo | `templates/runbook.md` | F7 · G7 | D17 · D16 (§7) | Responsable de operaciones | PER-nnn | D20 · soporte | D00 | D16 (D12 para §7) | Acciones que cambian estado |
| Notas de versión | `templates/release-notes.md` | F6 · G6 | D20 | Dueño de producto | PER-nnn | D02 · D16 · soporte | usuarios | D00 | Comunicación externa |
| Postmortem | `templates/postmortem.md` | F7 · G7 | D17 | Líder de ingeniería | PER-nnn | D16 · D12 (si hay seguridad) · soporte | D22 · D00 | D16 | Mando humano del incidente SEV1/SEV2 |
| Revisión de resultados 30/60/90 | `templates/outcome-review.md` | F8 · G8 | D08 · D17 | Dueño de producto | PER-nnn | D02 · D22 | D00 | D02 (D16 para §5) | Decisión sobre el producto |
| RACI (este documento) | `templates/raci.md` | F0 · G0 | D00 | Dueño de producto | PER-nnn | D01 · D02 | todos los activados | humano | — |
| | | | | | PER-nnn | | | | |

> Las filas se ajustan al proyecto; no se borran sin una razón escrita. El revisor es el del
> registro (`registry/departments.yaml`) para el departamento que produce. Un entregable de
> producto con un D00 en R es un error de asignación.

## 3. Puntos que ningún agente puede aprobar

Si el proyecto mantiene un catálogo de aprobaciones humanas (H1–H10), esta tabla se alinea con él.

| Punto | Aprueba (`PER-nnn`) | Evidencia exigida | Dónde se registra |
|---|---|---|---|
| Aceptación comercial antes de construir | | aceptación escrita con fecha y alcance | `.viltrum/commercial.md` |
| Arquitectura irreversible y modelo de datos | | ADR en estado `aceptado` | `adr.md` |
| Riesgo de seguridad, privacidad o pagos (R3/R4) | | firma del riesgo residual | `threat-model.md` §10 |
| Despliegue a producción y migraciones | | aprobación A4 con digest, alcance y ventana | `go-no-go.md` §2 |
| Comunicación externa (clientes, notas, incidentes) | | aprobación del texto y del envío | `release-notes.md` §9 · `go-no-go.md` §9 |
| Mando de incidente SEV1 y SEV2 | | comandante nombrado | `postmortem.md` §0 |
| Aceptación de riesgo residual | | firma con alcance y vigencia | `test-closure-report.md` §6 |
| Acción destructiva o sobre datos reales | | aprobación registrada antes de ejecutar | `runbook.md` §5 |
| Validación con usuarios reales (UAT) | | acta con fecha y participantes | `go-no-go.md` §4 |
| Revisión de muestras de aprobaciones automáticas (sesgo de automatización) | | acta de la muestra y su resultado | `.viltrum/` del proyecto |

## 4. Decisiones contenciosas (DACI)

| DEC | Decisión | Driver (reúne información y fuerza la decisión a tiempo) | Approver (una persona, `PER-nnn`) | Contributors (sin voto) | Informed | Fecha límite | Registro |
|---|---|---|---|---|---|---|---|
| DEC-nnn | | | | | | | `.viltrum/decisions.md` |

El Approver es siempre una persona. Los agentes pueden ser Driver o Contributor.

## 5. Criterios de hecho (verificación del RACI)

- [ ] Cada fila tiene exactamente una A y al menos un R
- [ ] Ninguna celda de la columna A es un departamento, un agente o un equipo
- [ ] Ninguna fila tiene al mismo actor como R y como revisor
- [ ] Cada `PER-nnn` tiene nombre, autoridad y suplente
- [ ] Cada persona de una A confirmó su rol por escrito (`EV-nnn`)
- [ ] Los puntos de §3 tienen persona asignada
- [ ] Ningún entregable de producto tiene a D00 como R

## 6. Historial de cambios

| Fecha | Cambio | Quién (persona) | Motivo (`DEC-nnn`) |
|---|---|---|---|
| | | | |

## 7. Firmas

| Rol | Quién | Fecha | Handoff / revisión (`HND-nnn`) |
|---|---|---|---|
| Produce | D00 | | |
| Revisión independiente (registro) | humano distinto de quien produjo | | |
| Aprueba | `aprobador_humano` (frontmatter) | | enlace a la aprobación |

## Evidencia

> Solo registros con ruta y fecha: la confirmación escrita de cada persona de §1 (correo,
> acta o mensaje) y el resultado de la comprobación del punto 8 de §0. "Quedamos de acuerdo
> en la reunión" no cuenta (`core/evidence-contract.md`). Lo no confirmado se escribe
> `no verificado`.
> Ruta relativa a la raíz del proyecto (normalmente `.viltrum/evidence/…`) y `sha256:<64 hex>`
> (`sha256sum <ruta>`) o SHA de commit. Sin ruta y hash, la fila no es evidencia.

| ID | Respalda | Tipo | Ruta o URL | sha256 / commit | Fecha (UTC) | Generada por |
|---|---|---|---|---|---|---|
| EV-001 | confirmación de rol de `PER-001` | | | | | |
