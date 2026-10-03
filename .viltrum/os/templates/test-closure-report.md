---
plantilla: test-closure-report
id: TCR-nnn
proyecto: <id del proyecto>
plan: TP-nnn              # plan de pruebas contra el que se cierra
departamento_dueno: D14
revisor: D00              # registro: D14 → D00
aprobador_humano:         # persona con autoridad que acepta (o rechaza) el riesgo residual de §6: dueño de producto o quien designe D00. D14 no lo acepta. Vacío hasta que firme; nunca lo rellena un agente
fase: F5
gate: G5
estado: borrador          # borrador · en_revision · aprobado · rechazado · superado
version: 0.1.0            # del documento; 1.0.0 = primera versión aprobada
fecha: AAAA-MM-DD
riesgo: R<n>
build:                    # commit o digest probado
---

# TCR-nnn · Informe de cierre de pruebas — <producto o cambio>

> Informe de cierre conforme a ISO/IEC/IEEE 29119-3: qué se probó frente al plan, qué
> resultó, qué defectos quedan y qué riesgo se hereda. Describe límites; no afirma calidad
> absoluta ni "100 % probado" por existir suites. D14 recomienda; la puerta G5 la declara
> quien no produjo el trabajo, y el riesgo residual lo acepta una persona.

## Resumen ejecutivo

<Tres líneas como máximo: qué se probó, qué se encontró, qué decide el siguiente paso.>

**Recomendación de D14 sobre G5:** APROBADO · CONDICIONAL (con excepciones de §5 y §6) · RECHAZADO

## 1. Alcance probado frente al plan

- Build probado: `<commit · digest>` · entorno `ENV-nnn` · del <fecha> al <fecha>
- Plan: `TP-nnn` versión `<x.y.z>`

| Elemento del plan | Probado (sí · parcial · no) | Razón de la desviación | Riesgo que deja |
|---|---|---|---|
| | | | |

## 2. Resultados de ejecución

> "No ejecutado" no es "pasó". Las cifras salen del reporte de la herramienta, no se teclean.

| Nivel · tipo | Planeados | Ejecutados | Pasaron | Fallaron | Bloqueados | No ejecutados | Evidencia |
|---|---:|---:|---:|---:|---:|---:|---|
| Unitaria | | | | | | | EV-nnn |
| Integración y contrato | | | | | | | |
| E2E | | | | | | | |
| Seis estados | | | | | | | |
| Permisos y tenant | | | | | | | |
| Regresión visual | | | | | | | |
| Accesibilidad | | | | | | | |
| Seguridad | | | | | | | |
| Rendimiento | | | | | | | |
| Pantallas y módulos ("nada abajo") | | | | | | | |
| Exploratoria | | | | | | | |
| **Total** | | | | | | | |

## 3. Criterios de salida del plan

| Criterio (copiado de `TP-nnn §4`) | Umbral | Resultado medido | Cumple | Evidencia |
|---|---|---|---|---|
| | | | sí · no | EV-nnn |

## 4. Cobertura de trazabilidad

RF Must: total ____ · verificados ____ · con `TC` fallido ____ · sin `TC` ____ · no ejecutados ____

| RF / NFR | `TC-nnn` | Resultado | Estado en la matriz del `PRD-nnn` | Motivo si no está `verificado` | Dueño |
|---|---|---|---|---|---|
| | | | | | |

La tabla lista solo las excepciones; el resto consta como `verificado` en la matriz de trazabilidad.

## 5. Defectos

**5.1 Por severidad** (`core/evidence-contract.md`)

| Severidad | Encontrados | Cerrados con prueba nueva en CI | Abiertos | Con riesgo aceptado (firmado, §6) |
|---|---:|---:|---:|---:|
| P0 | | | | |
| P1 | | | | |
| P2 | | | | |
| P3 | | | | |

Un P0 abierto congela la fase: el resultado propuesto es RECHAZADO. Un P1 abierto exige plan, dueño, fecha y aceptación escrita independiente.

**5.2 Defectos abiertos**

| ID | Severidad | Resumen | RF | Dueño (Dxx) | Plan y fecha | Estado (En revisión · Con hallazgos · Corregido · Aprobado con evidencia · Bloqueado · Riesgo aceptado) | Evidencia |
|---|---|---|---|---|---|---|---|
| BUG-001 | | | | | | | EV-nnn |

**5.3 Inestabilidad (flakiness) y cuarentenas**

| Prueba (`ruta::nombre`) | Primer fallo y éxito posterior | Dueño | Razón de la cuarentena | Fecha límite | Cobertura alternativa |
|---|---|---|---|---|---|
| | | | | | |

## 6. Riesgo residual y aceptación firmada

> Sin firma el riesgo no está aceptado: sigue abierto. La aceptación vale para este build;
> si cambia el artefacto o la migración, se revalida.

| ID | Qué puede fallar en producción (por lo abierto o lo no probado) | Severidad potencial (P0–P3) | Probabilidad | Mitigación o monitoreo (alerta · runbook) | Dueño | Aceptado por (persona con autoridad) | Fecha y alcance | Enlace a la firma | Vigencia (fecha o condición) |
|---|---|---|---|---|---|---|---|---|---|
| RR-001 | | | | | | | | | |

## 7. Prácticas sólidas verificadas

| Práctica o control que funciona | Cómo se comprobó | Evidencia |
|---|---|---|
| | | EV-nnn |

## 8. Límites de este informe

- Probado contra mocks (no acredita integración real con el proveedor): <…>
- No probado y por qué: <…>
- Navegadores, dispositivos y tamaños fuera de la matriz: <…>

## 9. Lecciones y acciones

| ID | Lección | Se convierte en (prueba · skill · SOP · deprecación · `MEMORY.md` de Dxx) | Dueño | Fecha | Enlace |
|---|---|---|---|---|---|
| LEC-001 | | | | | |

Lo que no se escribe en `MEMORY.md` o no se vuelve prueba, no ocurrió.

## 10. Handoff

- **Siguiente departamento:** D16 (solo si G5 queda aprobado) · departamento dueño de cada defecto abierto
- **Le entrego:** plan, casos, reportes, defectos cerrados y abiertos, cobertura omitida con su motivo
- **Le advierto:** riesgos residuales de §6 y su vigencia

## 11. Criterios de hecho (G5)

- [ ] Resultados por nivel tomados del reporte de la herramienta, con commit y ejecución de CI
- [ ] Cada criterio de salida del plan evaluado con valor medido
- [ ] Trazabilidad: ningún RF Must sin `TC` ni en estado distinto de `verificado` sin excepción escrita
- [ ] Los seis estados verificados en ejecución
- [ ] Cero P0 abiertos; cada P1 con plan, dueño, fecha y aceptación independiente
- [ ] Cada defecto cerrado tiene una prueba nueva en CI
- [ ] Riesgo residual declarado, con aceptación firmada por una persona que no es D14
- [ ] Prácticas sólidas y límites del informe escritos
- [ ] Lecciones convertidas en prueba, SOP, skill o `MEMORY.md`

## 12. Firmas

| Rol | Quién | Fecha | Handoff / revisión (`HND-nnn`) |
|---|---|---|---|
| Produce | D14 | | |
| Revisión independiente (registro) | D00 | | |
| Acepta el riesgo residual | `aprobador_humano` (frontmatter) | | enlace a la firma |

## Evidencia

> Solo artefactos generados por herramienta: reporte de la herramienta de pruebas, ejecución
> de CI con commit, capturas y trazas redactadas (sin tokens ni datos personales). "Lo probé"
> no cuenta (`core/evidence-contract.md`). Lo no ejecutado se escribe `no verificado`.
> Ruta relativa a la raíz del proyecto (normalmente `.viltrum/evidence/…`) y `sha256:<64 hex>`
> (`sha256sum <ruta>`) o SHA de commit. Sin ruta y hash, la fila no es evidencia.

| ID | Respalda | Tipo | Ruta o URL | sha256 / commit | Fecha (UTC) | Generada por |
|---|---|---|---|---|---|---|
| EV-001 | | | | | | |
