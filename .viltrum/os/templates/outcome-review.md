---
plantilla: outcome-review
id: OR-nnn
proyecto: <id del proyecto>
prd: PRD-nnn              # PRD y versión contra cuyas métricas se mide (si cambió después del lanzamiento, se cita la versión medida)
release: v<X.Y.Z>
lanzamiento:              # T0: fecha y hora (zona) del lanzamiento a producción
departamento_dueno: D08   # PROVISIONAL: nadie produce hoy la revisión de resultados; D08 la asume con datos de D17 hasta que exista un perfil de analítica de producto
coautores: [D17]          # señales operativas y datos de SLO (§5)
revisor: D02              # registro: D08 → D02. Lo que redacta D17 (§5) lo revisa D16
aprobador_humano:         # dueño de producto: decide continuar, iterar, pivotar o retirar (§6). Vacío hasta que la persona decida; nunca lo rellena un agente
fase: F8
gate: G8                  # "analítica revisada contra las métricas de éxito de G1"
estado: borrador          # borrador · en_revision · aprobado · rechazado · superado
version: 0.1.0            # del documento; se incrementa en cada corte (D+30 · D+60 · D+90)
fecha: AAAA-MM-DD
riesgo: R<n>
---

# OR-nnn · Revisión de resultados a 30, 60 y 90 días — <producto> v<X.Y.Z>

> Compara lo que pasó con lo que el `PRD-nnn` prometió. Mide resultado, no entrega: que el
> release salió no demuestra que el problema se resolvió. Un solo documento por release que
> se completa en tres cortes. D08 propone; la decisión sobre el producto es de la persona
> de `aprobador_humano`. Hechos, inferencias y recomendaciones se escriben separados.

## 0. Resumen del corte vigente

<Tres líneas como máximo: veredicto global, qué métrica se movió y cuál no, qué decisión se pide.>

## 1. Calendario y cortes

| Corte | Fecha (T0 + días) | Estado (pendiente · en curso · cerrado) | Aprueba (persona) | Fecha de aprobación | Enlace |
|---|---|---|---|---|---|
| D+30 | | | | | |
| D+60 | | | | | |
| D+90 | | | | | |

## 2. Plan de medición y validez de los datos

> Se completa **antes** de leer resultados. Una métrica sin instrumentación validada se marca
> `no medible` y genera un hallazgo; no se estima ni se rellena.

| MET | Fuente de datos (consulta o tablero exacto) | Evento o tabla | Instrumentación validada (`EV-nnn`: fecha · método) | Consentimiento y privacidad (aplica · estado) | Limitaciones (muestreo · retraso · exclusiones · laboratorio frente a campo) |
|---|---|---|---|---|---|
| MET-001 | | | | | |

## 3. Resultados frente a las métricas del PRD

| MET | Línea base | Objetivo | n y ventana | D+30 | D+60 | D+90 | Tendencia | Veredicto (cumple · parcial · no cumple · no medible) | Contramétrica (valor · ¿empeoró?) | Evidencia |
|---|---|---|---|---|---|---|---|---|---|---|
| MET-001 | | | | | | | | | | EV-nnn |

Las cifras se copian de la consulta registrada. Si la consulta no se puede reproducir, no es evidencia.

## 4. Atribución

| Factor distinto del release (campaña · estacionalidad · otro release · incidente · cambio de precio) | Efecto posible sobre las métricas | Cómo se controló (`no controlado` si no se pudo) |
|---|---|---|
| | | |

## 5. Señales operativas y cualitativas

| Fuente (SLO y presupuesto de error · incidentes · soporte · feedback · adopción por rol) | Periodo | Hallazgo | Evidencia |
|---|---|---|---|
| | | | EV-nnn |

- **SLO y presupuesto de error del periodo** (D17): <cumplido · consumido>
- **Incidentes** (`INC-nnn`, SEV) y su postmortem: <…>
- **Soporte:** volumen y causas principales de tickets: <…>
- **Feedback** (n y método; lo sintético se etiqueta como sintético y no vale como validación): <…>

## 6. Hallazgos y decisión

| ID | Hallazgo | Clase (hecho · inferencia · recomendación) | Implicación para el backlog | Propuesta de D08 (continuar · iterar · pivotar · retirar) | Se envía a (D02 prioriza · dueño) |
|---|---|---|---|---|---|
| HAL-001 | | | | | |

**Decisión del dueño de producto:** ____________ · fecha: ____________ · registrada como `DEC-nnn` en `.viltrum/decisions.md`

## 7. Guardas contra optimizar la métrica en lugar del objetivo

| MET | Riesgo de manipulación o sesgo | Verificación humana (muestra n · quién · fecha) | Resultado |
|---|---|---|---|
| | | | |

Cada objetivo se mira con al menos dos métricas en tensión; ninguna se usa como meta individual.

## 8. Deuda técnica y aprendizaje (G8)

- **Deuda técnica inventariada y priorizada:** `<enlace · IDs>`
- **Incidencias recurrentes** y lo que generaron (skill · SOP · prueba · deprecación): <…>

| ID | Lección | Destino (`MEMORY.md` de Dxx · SOP · skill · prueba · deprecación) | Dueño | Enlace |
|---|---|---|---|---|
| LEC-001 | | | | |

## 9. Criterios de hecho (G8)

- [ ] Plan de medición validado antes de leer resultados (§2)
- [ ] Cada métrica del PRD con valor por corte o marcada `no medible` con hallazgo abierto
- [ ] Contramétrica revisada y guardas de §7 aplicadas
- [ ] Atribución escrita; lo no controlado, declarado
- [ ] Hechos, inferencias y recomendaciones separados
- [ ] Decisión del dueño de producto registrada como `DEC-nnn`
- [ ] Deuda técnica inventariada y priorizada
- [ ] Lecciones escritas en `MEMORY.md` o convertidas en SOP, skill, prueba o deprecación
- [ ] Los hallazgos con impacto en alcance pasaron a D02

## 10. Firmas

| Secciones | Redacta | Revisa (independiente) | Fecha | Handoff / revisión (`HND-nnn`) |
|---|---|---|---|---|
| §0–§4, §6–§9 | D08 | D02 | | |
| §5 | D17 | D16 | | |
| Decisión por corte | — | `aprobador_humano` (frontmatter) | | enlace a la decisión |

Declara la puerta G8 quien no produjo el trabajo.

## Evidencia

> Solo artefactos reproducibles: la consulta o el tablero exportado con su fecha de corte,
> el registro de instrumentación validada, el informe de SLO. Una cifra sin consulta no
> cuenta (`core/evidence-contract.md`). Sin datos personales en las exportaciones. Lo no
> medible se escribe `no verificado` con su razón.
> Ruta relativa a la raíz del proyecto (normalmente `.viltrum/evidence/…`) y `sha256:<64 hex>`
> (`sha256sum <ruta>`) o SHA de commit. Sin ruta y hash, la fila no es evidencia.

| ID | Respalda | Tipo | Ruta o URL | sha256 / commit | Fecha (UTC) | Generada por |
|---|---|---|---|---|---|---|
| EV-001 | | | | | | |
