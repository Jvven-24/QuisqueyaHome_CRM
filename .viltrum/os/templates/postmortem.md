---
plantilla: postmortem
id: PM-nnn
proyecto: <id del proyecto>
incidente: INC-nnn
severidad: SEV<1-4>
departamento_dueno: D17
revisor: D16              # registro: D17 → D16
incident_commander:       # persona. OBLIGATORIO en SEV1 y SEV2: el mando de esos incidentes es humano. Un agente puede ser escriba, no comandante
autor_responsable:        # UNA persona responsable de completar el postmortem (el equipo que entrega el servicio); los agentes pueden redactar, no responder
aprobador_humano:         # liderazgo de ingeniería que aprueba el postmortem y el plazo de sus acciones. Vacío hasta que la persona apruebe; nunca lo rellena un agente
fase: F7
gate: G7                  # también alimenta G8 (lecciones y acciones)
estado: borrador          # borrador · en_revision · aprobado · acciones_en_curso · cerrado
version: 0.1.0            # del documento; 1.0.0 = primera versión aprobada
fecha: AAAA-MM-DD
riesgo: R<n>
publicar_antes_de:        # 48 h después del cierre verificado del incidente (AAAA-MM-DD HH:MM zona)
plazo_acciones_semanas: 8 # valor por defecto para cerrar las acciones; lo confirma o cambia el aprobador
---

# PM-nnn · Postmortem — <incidente, en una frase>

> Sin culpables. El objetivo es qué le faltó al sistema, al proceso o a la herramienta; no
> quién se equivocó. Si una frase nombra a una persona como causa, se reformula: ¿qué
> permitió que ese paso dependiera de la memoria de alguien? Los roles se citan por rol;
> los nombres aparecen solo para el comandante, el responsable y los dueños de acciones.
> Obligatorio para SEV1 y SEV2. Hechos, hipótesis, acciones y decisiones se separan
> siempre (`core/evidence-contract.md`).

## 0. Ficha

| Campo | Valor |
|---|---|
| Incidente · severidad al declarar · severidad final | INC-nnn · SEV_ · SEV_ |
| Cambios de severidad (hora y motivo) | |
| Declarado (fecha y hora, zona) · cerrado y verificado | |
| Duración del incidente · duración del impacto real | |
| Comandante del incidente (persona; SEV1/SEV2) | |
| Autor responsable (una persona) | |
| Runbook usado (`RB-nnn`) | |
| Publicado antes de (≤ 48 h del cierre) | |

## 1. Resumen

<Tres líneas como máximo: qué pasó, a quién afectó y cuál fue el impacto medible.>

## 2. Impacto

| Dimensión | Medición | Fuente (`EV-nnn`) |
|---|---|---|
| Usuarios o clientes afectados | | |
| Recorrido crítico y SLI afectado | | |
| Duración del impacto real (no solo del incidente) | | |
| Pérdida o corrupción de datos | sí · no — qué | |
| Costo de negocio (ingresos, confianza, soporte) | | |
| Presupuesto de error consumido (% de la ventana) | | |

Si el consumo supera el umbral de la política de presupuesto de error del proyecto (referencia: 20 % del presupuesto trimestral en la política de ejemplo de Google SRE), el postmortem exige al menos una acción de prioridad P0.

## 3. Línea de tiempo (zona horaria explícita)

| Hora | Evento | Clase (hecho · hipótesis · acción · decisión) | Fuente (log · alerta · canal · `EV-nnn`) | Rol |
|---|---|---|---|---|
| | Inicio real del problema (puede ser anterior a la detección) | | | |
| | Primera señal detectada | | | |
| | Incidente declarado y severidad asignada | | | |
| | Primera acción de mitigación | | | |
| | Causa identificada | | | |
| | Mitigación o reversión aplicada (D16, con aprobación humana) | | | |
| | Síntoma resuelto y verificado por el SLI | | | |
| | Incidente cerrado | | | |

Tiempo hasta detectar: ____ · hasta mitigar: ____ · hasta resolver: ____ (calculados desde esta tabla).

## 4. Detección y respuesta

| Pregunta | Respuesta | Evidencia |
|---|---|---|
| ¿Cómo se detectó? (alerta · cliente · persona) y ¿cuánto tardó? | | |
| ¿La alerta enlazaba su runbook? ¿Funcionó o le faltó un paso? | | |
| ¿Severidad asignada en los primeros minutos? | | |
| ¿Comandante humano nombrado (SEV1/SEV2) y canal único con línea de tiempo en vivo? | | |
| ¿Solo un grupo modificó el sistema y los traspasos se confirmaron? | | |
| ¿Qué se comunicó a clientes, quién lo aprobó (persona) y cuándo? | | |

## 5. Causa raíz y factores contribuyentes

**Causa raíz** (hecho verificado, del sistema, sin nombres): <…>

| ID | Factor contribuyente | Tipo (técnico · proceso · detección · comunicación · decisión) | Clase (hecho · inferencia) | Evidencia |
|---|---|---|---|---|
| CF-001 | | | | EV-nnn |

## 6. Qué funcionó y qué no

- **Funcionó** (para no desmontarlo por error): <…>
- **No funcionó** (detección tardía, alerta ausente, runbook incompleto, comunicación confusa…): <…>

## 7. Acciones

> Una acción sin dueño humano y sin fecha no cuenta. El dueño es una sola persona; el
> departamento que ejecuta puede ser un agente. Las acciones se cierran dentro de
> `plazo_acciones_semanas` desde la aprobación. Una acción vencida se escala al aprobador.
> Cierra una acción quien no la ejecutó.

| ID | Acción (verificable; "mejorar el monitoreo" no vale) | Tipo (prevención · detección · mitigación · proceso) | Prioridad (P0–P3) | Dueño (persona) | Ejecuta (Dxx) | Plazo (fecha) | Evidencia de cierre (PR · prueba · alerta; ruta · hash) | Estado | Cierra (persona o departamento distinto del que ejecutó) |
|---|---|---|---|---|---|---|---|---|---|
| AP-001 | | | | | | | | | |

## 8. Aprendizaje persistido

| ID | Lección | Destino (`MEMORY.md` de Dxx · SOP · skill · prueba · alerta · deprecación) | Enlace | Hecho (fecha) |
|---|---|---|---|---|
| LEC-001 | | | | |

Todo incidente recurrente genera una skill, un SOP, una prueba o una deprecación (G8). D22 recibe el aprendizaje.

## 9. Hallazgos derivados

Las escalas coexisten sin equivalencia fijada: SEV describe el incidente; P0–P3 describe cada hallazgo.

| SEV del incidente | Hallazgos derivados (`BUG-nnn` · `THR-nnn` · `AP-nnn`) con severidad P0–P3 |
|---|---|
| | |

## 10. Criterios de hecho (G7)

- [ ] Publicado dentro de las 48 h del cierre verificado
- [ ] Comandante humano nombrado en SEV1 y SEV2
- [ ] Una sola persona responsable del postmortem
- [ ] Línea de tiempo con zona horaria, fuente por evento y clase (hecho · hipótesis · acción · decisión)
- [ ] Impacto medido, incluido el presupuesto de error consumido
- [ ] Causa raíz y factores del sistema, sin nombrar personas
- [ ] Qué funcionó y qué no
- [ ] Cada acción con dueño humano, plazo dentro de `plazo_acciones_semanas` y evidencia de cierre esperada
- [ ] Lecciones persistidas en `MEMORY.md`, SOP, skill, prueba o alerta
- [ ] Evidencia redactada: sin datos personales ni secretos
- [ ] Aprobado por la persona de `aprobador_humano`

## 11. Firmas

| Rol | Quién | Fecha | Handoff / revisión (`HND-nnn`) |
|---|---|---|---|
| Autor responsable | persona (frontmatter `autor_responsable`) | | |
| Redacta o reúne evidencia | D17 | | |
| Revisión independiente (registro) | D16 | | |
| Aprueba el postmortem y el plazo de las acciones | `aprobador_humano` (frontmatter) | | enlace a la aprobación |

## Evidencia

> Solo artefactos generados por herramienta, redactados: exportaciones de logs y de la
> alerta, consultas del SLI, capturas del canal del incidente. Sin datos personales ni
> secretos. Lo reconstruido de memoria se marca `hipótesis`, no se presenta como hecho
> (`core/evidence-contract.md`). Lo no verificado se escribe `no verificado`.
> Ruta relativa a la raíz del proyecto (normalmente `.viltrum/evidence/…`) y `sha256:<64 hex>`
> (`sha256sum <ruta>`) o SHA de commit. Sin ruta y hash, la fila no es evidencia.

| ID | Respalda | Tipo | Ruta o URL | sha256 / commit | Fecha (UTC) | Generada por |
|---|---|---|---|---|---|---|
| EV-001 | | | | | | |
