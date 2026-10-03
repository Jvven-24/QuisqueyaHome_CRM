---
plantilla: prd
id: PRD-nnn
proyecto: <id del proyecto>
departamento_dueno: D01
coautores: [D02]
revisor: D02              # registro: D01 → D02. Lo que redacta D02 lo revisa D01 (ver §14)
aprobador_humano:         # dueño de producto o cliente que acepta este PRD como base de alcance. Vacío hasta que la persona lo apruebe; nunca lo rellena un agente
fase: F1
gate: G1                  # §1 y §2 sustentan además G0
estado: borrador          # borrador · en_revision · aprobado · rechazado · superado
version: 0.1.0            # del documento; 1.0.0 = primera versión aprobada
fecha: AAAA-MM-DD
riesgo: R<n>
---

# PRD-nnn · <producto o cambio, en términos de resultado>

> Contrato de requisitos entre D01/D02 y el resto de la cadena. Cada requisito cumple
> ISO/IEC/IEEE 29148: necesario, sin implementación, no ambiguo, consistente, completo,
> singular, factible, trazable, verificable, asequible y acotado. El que no cumple se
> reescribe, se divide o pasa a §11 como pregunta.
>
> No se duplica lo que ya tiene archivo: preguntas en `.viltrum/questions.md`, fuentes en
> `.viltrum/sources.md`, historias en `departments/D01-discovery/templates/user-story.md`,
> matriz de trazabilidad completa en `departments/D01-discovery/templates/traceability-matrix.md`.
>
> `RF-nnn` es el ID de requisito funcional y `NFR-nnn` el de no funcional (convención de D01). `REQ-nnn` queda
> reservado a los pedidos del panel en `.viltrum/requests.md`.

## Resumen

<Tres líneas como máximo: qué problema se resuelve, para quién, qué cambia si funciona y qué decide el siguiente paso.>

## 1. Problema (sin nombrar la solución)

- **Quién lo sufre:** <rol o segmento concreto; `ROL-nnn` si ya existe en §3>
- **Qué le pasa y con qué frecuencia:** <dolor observable, con número>
- **Qué ocurre si no se resuelve:** <costo o consecuencia medible>
- **Restricciones bloqueantes:** <presupuesto · plazo · marca · legal>

| ID | Afirmación | Clase | Fuente (`SRC-nnn`) | Evidencia |
|---|---|---|---|---|
| AF-001 | | hecho · hipótesis · petición | | EV-nnn |

> Solo un `hecho` con fuente y evidencia sustenta G0. Una hipótesis o una petición nunca se
> redacta como hecho. Si la necesidad llegó como solución ("necesito una app de X"), se
> desarma aquí: qué problema resuelve esa app.

## 2. Métricas de éxito

> Resultado, no entrega: "el asesor recibe solicitudes completas", no "se publicó el formulario".
> Cada objetivo lleva una contramétrica: lo que no debe empeorar mientras se persigue.

| ID | Métrica | Línea base | Objetivo (número) | Plazo | Cómo se mide (consulta o fuente exacta) | Contramétrica | Dueño de la métrica (persona) | Revisión (D+30 · D+60 · D+90) |
|---|---|---|---|---|---|---|---|---|
| MET-001 | | | | | | | | `outcome-review.md` |

Línea base `no medida` es válida solo si existe un `RF-nnn` que la instrumenta antes del lanzamiento.

## 3. Usuarios y roles (catálogo)

| ID | Rol | Quién es | Qué necesita lograr | Acciones permitidas (no "acceso general") | Rol por defecto del usuario nuevo |
|---|---|---|---|---|---|
| ROL-001 | | | | | sí · no |

## 4. Requisitos funcionales

> Forma: `<Rol o sistema> deberá <acción> <objeto> <condición medible>`. Una sola cosa por
> requisito: si lleva "y" entre acciones, son dos. Sin nombrar tecnología ni proveedor.
> Verificación: **T** prueba · **I** inspección · **A** análisis · **D** demostración.

| ID | Requisito | Origen (`Q-nnn` · `SRC-nnn` · `MET-nnn`) | Criterio de aceptación (Dado / Cuando / Entonces, con valor medible) | Verif. | MoSCoW (propone D01, decide D02) | Estado |
|---|---|---|---|---|---|---|
| RF-001 | | | | T · I · A · D | | |

Los IDs no se renumeran ni se reutilizan. Un requisito descartado conserva su fila con estado `retirado` y la razón.

### 4.1 Línea base de capacidades esperadas

> Copiadas de `departments/D01-discovery/reference/expected-capabilities.md` para este tipo de solución. Lo que no aplica se marca "no aplica" con razón; no se omite en silencio.

| Capacidad esperada | Incluida · Excluida | Razón si se excluye |
|---|---|---|
| | | |

## 5. Requisitos no funcionales (ISO/IEC 25010:2023)

Características revisadas (las que no aplican llevan `N/A: razón`):
`[ ]` adecuación funcional · `[ ]` eficiencia de desempeño · `[ ]` compatibilidad · `[ ]` capacidad de interacción · `[ ]` fiabilidad · `[ ]` seguridad · `[ ]` mantenibilidad · `[ ]` flexibilidad · `[ ]` protección (safety)

| ID | Característica | Requisito | Métrica | Objetivo (número) | Cómo se mide (herramienta, conjunto de datos, percentil) | Verif. | MoSCoW |
|---|---|---|---|---|---|---|---|
| NFR-001 | | | | | | T · A | |

> "Rápido", "seguro" y "escalable" no son NFR. Sin número no entra aquí: pasa a §11 con `bloquea:G1`.

## 6. Reglas de negocio

| ID | Regla | Excepción (o "sin excepción") | Caso límite (cero · uno · muchos · simultáneo · vencido) | Quién aprueba la excepción (persona) | RF relacionados |
|---|---|---|---|---|---|
| BR-001 | | | | | |

## 7. Fuera de alcance (decide D02)

> Toda capacidad de línea base esperable (`departments/D01-discovery/reference/expected-capabilities.md`)
> que no entra en este alcance se escribe aquí. Callar una exclusión es alcance implícito.

| ID | Función excluida | Razón | Revisar en (fase o fecha) | Decide (persona) |
|---|---|---|---|---|
| OUT-001 | | | | |

## 8. Supuestos, restricciones y dependencias

| ID | Tipo | Descripción | Si es falso: qué cambia | Dueño | Verificar antes de |
|---|---|---|---|---|---|
| SUP-001 | supuesto · restricción · dependencia | | | | |

## 9. Riesgo del proyecto

`RIESGO: R<n>` — <razón en una línea según `core/routing.md`: el riesgo lo fija el dato y la acción, no el tamaño>

| ID | Riesgo heredado a F2 | Probabilidad | Impacto (P0–P3) | Dueño | Mitigación |
|---|---|---|---|---|---|
| RSK-001 | | | | | |

## 10. Trazabilidad (resumen)

| RF / NFR | Origen | Diseño (`RFC-nnn` · `ADR-nnn`) | Prueba (`TC-nnn`) | Estado |
|---|---|---|---|---|
| RF-001 | | | | sin diseño |

Estados: `sin diseño` · `en diseño` · `diseñado` · `en construcción` · `construido` · `en prueba` · `verificado` · `no aplica` (con razón).
Al cerrar F1 las columnas Diseño y Prueba están vacías a propósito: las llenan D03 (F2) y D14 (F5).
Ningún requisito Must llega a G5 en estado distinto de `verificado`.

## 11. Preguntas abiertas

> El estado y la respuesta de cada pregunta viven solo en `.viltrum/questions.md`. Aquí se
> referencian, no se copian. Con una `Q-nnn` `bloquea:G1` abierta no hay G1.

| Q-nnn | Resumen | Bloquea (`G0`…`G8` · `ninguna`) | Afecta a (RF / NFR) | Responde (cliente · equipo · proveedor) | Prioridad |
|---|---|---|---|---|---|
| | | | | | |

## 12. Revisión de calidad de requisitos (29148)

Revisados: <n> de <n> requisitos. Muestreo (si no fue 100 %) y criterio: <…>

| RF / NFR | Atributo(s) fallido(s) | Corrección pedida | Estado (abierto · corregido · aceptado con razón) |
|---|---|---|---|
| | | | |

Tabla vacía = el revisor declara que revisó todos los requisitos y ninguno falló.

## 13. Criterios de hecho (G1)

- [ ] §1 enuncia el problema sin nombrar la solución y tiene al menos un hecho con fuente y evidencia
- [ ] Cada RF y NFR cumple los once atributos de 29148 (§12 sin pendientes)
- [ ] Cada RF tiene criterio de aceptación verificable y método de verificación
- [ ] Cada NFR tiene número y forma de medirlo
- [ ] Roles y permisos definidos como catálogo (§3), no como prosa
- [ ] Cada regla de negocio tiene excepción y caso límite (§6)
- [ ] Exclusiones escritas con razón y fecha de revisión (§7)
- [ ] Cada métrica tiene objetivo numérico, contramétrica, dueño y fecha de revisión (§2)
- [ ] Prioridad decidida por D02 con la prueba DSDM; los Must no superan ~60 % de la capacidad declarada
- [ ] Cero `Q-nnn` con `bloquea:G1` abiertas
- [ ] Sin requisitos contradictorios entre sí; revisión cruzada D01 ↔ D02 firmada
- [ ] Riesgo R0–R4 clasificado con su razón

## 14. Firmas

| Secciones | Redacta | Revisa (independiente) | Fecha | Handoff / revisión (`HND-nnn`) |
|---|---|---|---|---|
| §1, §3–§6, §8–§11 | D01 | D02 | | |
| §2, prioridad MoSCoW de §4, §7 | D02 | D01 | | |
| Aceptación como base de alcance | — | `aprobador_humano` (frontmatter) | | enlace a la aprobación |

La aceptación comercial (C1) no se registra aquí: vive en `.viltrum/commercial.md`. Declara la
puerta G1 quien no produjo el trabajo (D00 o la persona designada), nunca el productor.

## Evidencia

> Solo artefactos generados por herramienta o aportados por una persona con fecha: acta o
> transcripción registrada (`SRC-nnn`), consulta de datos reproducible, captura del proceso actual.
> "Lo vi" no cuenta (`core/evidence-contract.md`). Lo que no se pudo verificar se escribe
> `no verificado` con su razón; no se inventa la fila.
> Ruta relativa a la raíz del proyecto (normalmente `.viltrum/evidence/…`) y `sha256:<64 hex>`
> (`sha256sum <ruta>`) o SHA de commit. Sin ruta y hash, la fila no es evidencia.

| ID | Respalda | Tipo | Ruta o URL | sha256 / commit | Fecha (UTC) | Generada por |
|---|---|---|---|---|---|---|
| EV-001 | | | | | | |
