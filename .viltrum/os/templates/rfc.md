---
plantilla: rfc
id: RFC-nnn
proyecto: <id del proyecto>
departamento_dueno: D03
revisor: human            # registro: D03 → human
aprobador_humano:         # persona que decide la RFC (líder técnico o quien designe el dueño de producto). Vacío hasta que decida; nunca lo rellena un agente
fase: F2
gate: G2
estado: borrador          # borrador · en_revision · aprobado · rechazado · superado
version: 0.1.0            # del documento; 1.0.0 = primera versión aprobada
fecha: AAAA-MM-DD
riesgo: R<n>
alcance_rfc: completo     # breve (§1, §3, §5, §7, §8: cambio acotado) · completo (todas las secciones)
adr_generado:             # ADR-nnn; se completa cuando la decisión queda registrada
---

# RFC-nnn · <decisión o diseño, en una frase>

> Vehículo de revisión previo al ADR. Se publica antes de escribir código, circula para
> comentarios y termina en una decisión registrada como `ADR-nnn` (`templates/adr.md`) o en
> rechazo. No se implementa nada que dependa de una RFC sin ADR en estado `aceptado`.
> Si la capacidad se puede comprar o integrar, el expediente de D21 (`templates/research-dossier.md`)
> va primero (P0: todo está creado).

## 1. Contexto y alcance

- **Qué obliga a decidir** (el problema técnico, no la solución): <…>
- **Requisitos que lo originan** (`PRD-nnn`): `RF-nnn` / `NFR-nnn` con su valor numérico: <…>
- **Estado actual verificado** (hechos con `ruta:línea`, comando o commit): <…>
- **¿Ya existe?** Expediente D21: `<ruta>` cerrado en <fecha> · o por qué no aplica: <…>
- **Incluye:** <…>
- **No incluye:** <…>

## 2. Metas y no-metas

| ID | Meta o no-meta | Criterio medible |
|---|---|---|
| OBJ-001 | meta | |
| NOBJ-001 | no-meta (lo que esta RFC deliberadamente no busca) | |

## 3. Diseño propuesto

**Descripción** (diez líneas como máximo) y diagrama: `<ruta del diagrama>` → `EV-nnn`.

**Módulos y contratos**

| Módulo | Responsabilidad (una frase, sin "y") | Conoce a | Expone | En esta RFC |
|---|---|---|---|---|
| | | | | nuevo · modificado · sin cambio |

**Puertos y adaptadores**

| Pieza reemplazable | Puerto (contrato propio) | Adaptador | Proveedor (solo aquí; fuera de `adapters/` es hallazgo P2) |
|---|---|---|---|
| | | | |

**Datos y catálogos**

| Entidad o catálogo | Dueño del dato | Fuente (base de datos · configuración · enum tipado) | ¿Lo cambia el negocio? | 3FN o desnormalización justificada | Retención |
|---|---|---|---|---|---|
| | | | | | |

**Fallos, concurrencia y restauración**

| Escenario | Comportamiento esperado | NFR | Cómo se verifica |
|---|---|---|---|
| Falla una dependencia | | | |
| Operación repetida o simultánea (idempotencia) | | | |
| Restauración desde respaldo | | | |

## 4. Alternativas

**4.1 Criterios y pesos** (se fijan y se comparten con el revisor antes de puntuar; suman 100)

| Criterio | Peso | Qué se mira |
|---|---:|---|
| Cumple metas y NFR | 25 | |
| Reversibilidad y bajo acoplamiento (P1) | 20 | |
| Seguridad y privacidad | 15 | |
| Operabilidad: observar, desplegar, revertir | 15 | |
| Costo a 3 años | 10 | |
| Complejidad y carga cognitiva del equipo | 10 | |
| Riesgo de entrega (plazo, dependencias) | 5 | |
| **Total** | **100** | |

**4.2 Alternativas** (incluye siempre "no cambiar" como `ALT-C`)

| ID | Descripción en una frase | Cómo cumple las metas | Qué cuesta | Evidencia |
|---|---|---|---|---|
| ALT-A | propuesta del autor | | | EV-nnn |
| ALT-B | | | | |
| ALT-C | no cambiar | | | |

**4.3 Puntuación** — nota 0–5 por criterio; puntaje = Σ (peso × nota) ÷ 5

| Criterio | Peso | ALT-A | ALT-B | ALT-C |
|---|---:|---:|---:|---:|
| Cumple metas y NFR | 25 | | | |
| Reversibilidad y bajo acoplamiento | 20 | | | |
| Seguridad y privacidad | 15 | | | |
| Operabilidad | 15 | | | |
| Costo a 3 años | 10 | | | |
| Complejidad y carga cognitiva | 10 | | | |
| Riesgo de entrega | 5 | | | |
| **Puntaje** | **100** | | | |

**4.4 Por qué se descartan las demás** — una razón concreta por alternativa, con evidencia. "Es la más popular" no es razón.

> Si dos alternativas quedan a menos de 10 puntos, decide la reversibilidad y se escribe
> aquí. Si la alternativa es comprar o integrar una capacidad externa, la puntuación de
> `core/doctrine/buy-vs-build.md` (expediente D21) sustituye a esta tabla.

## 5. Preocupaciones transversales

> Cada fila se responde o lleva `N/A: razón`. Una fila vacía deja la RFC en borrador.

| Área | Qué debe responder el diseño | Respuesta | Valida | Enlace |
|---|---|---|---|---|
| Seguridad | ¿Qué entradas, fronteras y permisos nuevos aparecen? ¿Aislamiento por tenant en datos, caché y jobs? ¿Hace falta `threat-model.md` (R2+)? | | D12 | |
| Privacidad y datos | ¿Qué dato personal entra, con qué finalidad y retención? ¿Migración reversible? | | D11 · D12 | |
| Operación y reversión | ¿SLI/SLO? ¿Qué se observa? ¿Cómo se despliega y se revierte? ¿Punto de no retorno? | | D16 · D17 | |
| Rendimiento y capacidad | ¿Presupuesto y carga esperada (NFR)? | | D15 | |
| Pruebas | ¿Cómo se verifica cada RF/NFR afectado? ¿A qué nivel? | | D14 | |
| Compatibilidad y versionado | ¿Qué contratos, API o eventos cambian? ¿Qué pasa con los clientes que no se actualizaron? | | D03 | |
| Costo y licencias | ¿Costo a 3 años, licencia y plan de salida? | | D21 | |
| Experiencia (si toca UI) | ¿Los seis estados y la accesibilidad quedan cubiertos? | | D06 · D07 | |

## 6. Migración y reversión (G2)

| Fase | Qué cambia | Reversible por sí sola | Cómo se revierte |
|---|---|---|---|
| expand | | sí · no | |
| migrate | | sí · no | |
| verify | | sí · no | |
| contract | | sí · no | |

- **Punto de no retorno:** <a partir de qué paso revertir exige restaurar desde respaldo>
- **Datos que podrían perderse y cómo se concilian (RPO):** <…>

> Un "down migration" que borra datos no es una reversión segura. `expand` y `contract` nunca van en el mismo despliegue.

## 7. Decisión pendiente

```
DECISIÓN QUE SE PIDE:   <una frase en imperativo>
PROPUESTA DEL AUTOR:    ALT-<x> — porque <razón con puntaje>
TIPO:                   reversible · costosa de revertir · irreversible
                        (irreversibles según D03: motor de base de datos, multi-tenencia,
                         formato del identificador público, auditoría, zona horaria,
                         estrategia de borrado, moneda y decimales, idioma base)
DECIDE (persona):       <nombre y rol>             FECHA LÍMITE: <AAAA-MM-DD>
SI NO SE DECIDE:        <qué se bloquea y desde cuándo>
GENERA:                 ADR-nnn (`templates/adr.md`)
```

## 8. Comentarios y consenso

| ID | Revisor | Comentario | Tipo (bloqueante · sugerencia · pregunta) | Respuesta | Estado (abierto · resuelto · aceptado como riesgo) |
|---|---|---|---|---|---|
| COM-001 | | | | | |

**Decisiones contenciosas** (desacuerdo que no se resolvió con comentarios): posiciones, quién las sostiene y quién desempató (persona) → `DEC-nnn` en `.viltrum/decisions.md`: <…>

## 9. Preguntas abiertas

> El estado vive en `.viltrum/questions.md`; aquí solo se referencian.

| Q-nnn | Resumen | Bloquea | Responde |
|---|---|---|---|
| | | | |

## 10. Criterios de hecho (G2)

- [ ] Requisitos y NFR de origen citados con su número; sin NFR numérico no hay diseño
- [ ] "¿Ya existe?" respondido con el expediente de D21 cerrado o con la razón de que no aplica
- [ ] Cada módulo tiene una responsabilidad descrita sin "y"; el diagrama de dependencias no tiene ciclos
- [ ] Toda pieza reemplazable está detrás de un puerto propio; el proveedor no aparece fuera de `adapters/`
- [ ] Catálogos con fuente declarada; ninguno hardcodeado
- [ ] Al menos dos alternativas más "no cambiar", con puntaje y fundamento
- [ ] Preocupaciones transversales respondidas o `N/A: razón`
- [ ] Estrategia de migración y de reversión con punto de no retorno
- [ ] Cero comentarios bloqueantes abiertos
- [ ] La decisión quedó registrada en un `ADR-nnn` (o la RFC se rechazó con su razón)

## 11. Firmas

| Rol | Quién | Fecha | Handoff / revisión (`HND-nnn`) |
|---|---|---|---|
| Produce | D03 | | |
| Revisión independiente (registro) | humano (par senior distinto del autor) | | |
| Decide | `aprobador_humano` (frontmatter) | | enlace a la decisión |
| Consultados | D11 · D12 · D16 · D17 · D21 (según §5) | | |

Declara la puerta G2 quien no produjo el trabajo; la RFC no la declara.

## Evidencia

> Solo artefactos generados por herramienta o por una persona con fecha: mediciones o
> prototipos con comando reproducible, `ruta:línea` verificada contra commit, expediente D21,
> diagramas versionados. "Me parece" no cuenta (`core/evidence-contract.md`). Lo no
> verificable se escribe `no verificado`.
> Ruta relativa a la raíz del proyecto (normalmente `.viltrum/evidence/…`) y `sha256:<64 hex>`
> (`sha256sum <ruta>`) o SHA de commit. Sin ruta y hash, la fila no es evidencia.

| ID | Respalda | Tipo | Ruta o URL | sha256 / commit | Fecha (UTC) | Generada por |
|---|---|---|---|---|---|---|
| EV-001 | | | | | | |
