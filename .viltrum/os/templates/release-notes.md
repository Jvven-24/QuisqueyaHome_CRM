---
plantilla: release-notes
id: RN-nnn
proyecto: <id del proyecto>
release: v<X.Y.Z>
audiencias: [usuario, administrador]
departamento_dueno: D20
revisor: D00              # registro: D20 → D00. El contenido de cada cambio lo valida además su departamento dueño y un lector objetivo (§8)
aprobador_humano:         # OBLIGATORIO. Persona que aprueba la publicación de estas notas (comunicación externa). Vacío en la plantilla y en todo borrador; sin nombre este documento no puede pasar a estado: aprobado ni publicarse. Nunca lo rellena un agente
fase: F6
gate: G6                  # "documentación mínima entregada"; las notas se enlazan desde go-no-go.md
estado: borrador          # borrador · en_revision · aprobado · publicado · superado
version: 0.1.0            # del documento; 1.0.0 = primera versión aprobada
fecha: AAAA-MM-DD
riesgo: R<n>
---

# RN-nnn · Notas de versión — <producto> v<X.Y.Z>

> Una nota por audiencia, escrita para quien la lee. Cada entrada nace de un cambio real
> (`RF-nnn`, PR o commit): lo que no tiene origen no se publica. Los comandos, rutas y
> nombres citados existen en el build (verificado contra el commit), no se infieren.
> Un agente redacta; aprobar y enviar una comunicación externa es de una persona.

## 0. Resumen

- **Qué cambia, en una frase por audiencia:** usuarios: <…> · administradores: <…>
- **¿Requiere acción de alguien?** sí · no — <quién y cuándo>
- **¿Es incompatible con la versión anterior?** sí · no — ver §3 y §4
- **Fecha de publicación prevista (zona):** <…>

## 1. Para usuarios

> Lenguaje de la tarea del usuario, sin jerga ni nombres internos. "Qué cambia para ti", no "qué se implementó".

| Tipo (Nuevo · Mejorado · Corregido) | Qué cambia para ti | Cómo usarlo o dónde verlo | Rol afectado (`ROL-nnn`) | Origen (`RF-nnn` · PR · commit) |
|---|---|---|---|---|
| | | | | |

## 2. Para administradores

| Área (configuración · permisos · integraciones · operación · seguridad) | Cambio | Acción requerida (antes · durante · después) | Variable o permiso afectado (solo nombres, nunca valores ni credenciales) | Origen |
|---|---|---|---|---|
| | | | | |

## 3. Migración y compatibilidad

- **Versión mínima desde la que se puede actualizar:** <…>
- **Cambios de esquema** (fase `expand` · `migrate` · `verify` · `contract`) y duración estimada: <…>
- **Requiere indisponibilidad:** sí · no — ventana y aprobación de negocio: <…>
- **Compatibilidad de contratos** (versión de API, eventos): <…>
- **Cómo se revierte y punto de no retorno:** `<enlace al runbook de reversión>`

| # | Acción | Quién (usuario · administrador · automático) | Verificación (qué debe verse) | Si falla |
|---|---|---|---|---|
| 1 | | | | |

## 4. Cambios incompatibles y deprecaciones

| ID | Qué deja de funcionar | Desde (versión) | Reemplazo | Fecha de retiro | Aviso dado (fecha · canal) |
|---|---|---|---|---|---|
| DPR-001 | | | | | |

## 5. Seguridad

| Corrección | Severidad (P0–P3) | Referencia (CVE · GHSA · `THR-nnn`) | ¿Requiere acción del usuario o administrador? (cambiar clave · revocar tokens · actualizar) |
|---|---|---|---|
| | | | |

Los detalles explotables se publican cuando el parche está desplegado y los afectados fueron avisados.

## 6. Problemas conocidos

> Un problema sin alternativa ni plan no es "conocido": es un riesgo abierto y vuelve a
> `go-no-go.md`. Un P0 conocido no se publica: bloquea el lanzamiento.

| ID | Descripción | Quién lo nota (rol) | Impacto | Alternativa | Severidad (P1–P3) | Plan (versión o fecha) | Dueño (persona) |
|---|---|---|---|---|---|---|---|
| KI-001 | | | | | | | |

## 7. Registro técnico (Keep a Changelog)

Se genera desde los commits y PR del release (D13), no por inferencia. Archivo: `CHANGELOG.md`.

| Categoría (Added · Changed · Deprecated · Removed · Fixed · Security) | Entrada | PR · commit |
|---|---|---|
| | | |

## 8. Verificación del texto

| Comprobación | Quién (persona o lector sin contexto) | Entorno | Bloqueos encontrados | Corregidos en |
|---|---|---|---|---|
| Un lector objetivo siguió §3 en un entorno aislado | | | | |
| Cada comando, ruta y nombre citado existe en el commit `<sha>` | | | | |
| Cada entrada de §1 y §2 enlaza a su origen | | | | |

## 9. Publicación (comunicación externa)

| Canal | Audiencia | Fecha y hora de envío (zona) | Lo envía (persona) | Aprobación (`aprobador_humano`, frontmatter) | Enlace a la aprobación |
|---|---|---|---|---|---|
| | | | | | |

## 10. Criterios de hecho (G6)

- [ ] Una sección por audiencia, sin jerga en la de usuarios
- [ ] Toda entrada con origen verificable
- [ ] Migración con pasos literales, verificación por paso, reversión y punto de no retorno
- [ ] Cambios incompatibles y deprecaciones con fecha de retiro y reemplazo
- [ ] Seguridad sin detalle explotable antes del parche
- [ ] Problemas conocidos con alternativa y plan; ninguno P0
- [ ] Un lector sin contexto completó la migración, o el límite de la revisión está declarado
- [ ] Campo `aprobador_humano` completado por la persona antes de publicar; si está vacío, no se publica

## 11. Firmas

| Rol | Quién | Fecha | Handoff / revisión (`HND-nnn`) |
|---|---|---|---|
| Produce | D20 | | |
| Revisión independiente (registro) | D00 | | |
| Valida el contenido de cada cambio | departamento dueño del cambio | | |
| Aprueba la publicación | `aprobador_humano` (frontmatter) | | enlace a la aprobación |

## Evidencia

> Solo artefactos con ruta y fecha: commit y PR de origen, acta de la lectura sin contexto,
> captura de lo descrito. Lo no verificado se escribe `no verificado` (`core/evidence-contract.md`).
> Ruta relativa a la raíz del proyecto (normalmente `.viltrum/evidence/…`) y `sha256:<64 hex>`
> (`sha256sum <ruta>`) o SHA de commit. Sin ruta y hash, la fila no es evidencia.

| ID | Respalda | Tipo | Ruta o URL | sha256 / commit | Fecha (UTC) | Generada por |
|---|---|---|---|---|---|---|
| EV-001 | | | | | | |
