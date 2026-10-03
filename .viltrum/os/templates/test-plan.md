---
plantilla: test-plan
id: TP-nnn
proyecto: <id del proyecto>
departamento_dueno: D14
revisor: D00              # registro: D14 → D00
aprobador_humano:         # líder de desarrollo o dueño de producto que acepta el plan y lo excluido de él. D14 no lo acepta por sí mismo. Vacío hasta que la persona apruebe; nunca lo rellena un agente
fase: F5
gate: G5                  # se puede redactar desde F2 con los RF/NFR numéricos; el build y el entorno se completan al abrir F5
estado: borrador          # borrador · en_revision · aprobado · rechazado · superado
version: 0.1.0            # del documento; 1.0.0 = primera versión aprobada
fecha: AAAA-MM-DD
riesgo: R<n>
build:                    # commit o digest bajo prueba (vacío mientras no exista build)
---

# TP-nnn · Plan de pruebas — <producto o cambio>

> Plan basado en riesgo, alineado a ISO/IEC/IEEE 29119-3 (contexto, estrategia, criterios de
> entrada y salida, requisitos de datos y de entorno, personas y calendario). **Este
> documento no contiene resultados**: sin entorno disponible se emite plan, no un resultado
> ficticio. Los resultados van en `test-closure-report.md`.
> Los porcentajes de líneas no sustituyen la cobertura de negocio: se mide cobertura de RF.

## 1. Contexto y alcance

| Elemento bajo prueba (módulo · servicio · pantalla) | Versión (commit · digest) | RF / NFR | En alcance | Razón de la exclusión (basada en riesgo) |
|---|---|---|---|---|
| | | | sí · no | |

- **Supuestos y restricciones:** <entorno, accesos, mocks de terceros, ventanas>
- **Interesados:** <quién usa el informe y quién acepta el riesgo residual (persona)>
- **Fuentes de verdad:** criterios de aceptación de `PRD-nnn`, contratos de D03/D10/D11, modelo de amenazas `TM-nnn`, matriz pantalla × estado de D05/D06

## 2. Riesgo de producto y profundidad

Riesgo del proyecto: `R<n>` → profundidad mínima (`core/routing.md`): R0 humo · R1 funcional · R2 funcional + E2E · R3 + regresión · R4 + aceptación formal.

Puntaje = probabilidad (1 baja · 2 media · 3 alta) × impacto (1 menor · 2 relevante · 3 P0 o P1 según `core/evidence-contract.md`). ≥ 6 profundidad máxima · 3–5 intermedia · ≤ 2 mínima. Se priorizan pérdida de datos, autorización, transacciones, pagos, recorridos críticos y cambios de contrato.

| ID | Riesgo de producto (qué puede fallar y qué cuesta) | Origen (RF · NFR · `THR-nnn`) | Prob. | Impacto | Puntaje | Respuesta de prueba (nivel y profundidad) |
|---|---|---|---:|---:|---:|---|
| RSK-001 | | | | | | |

## 3. Niveles y tipos de prueba

> Base amplia en unitarias e integración; pocos E2E, reservados a recorridos críticos.
> Un nivel que no aplica lleva `N/A: razón` revisada por D00.

| Nivel · tipo | Qué cubre | Responsable | Cómo se ejecuta (herramienta · ruta) | Dónde corre | Aplica |
|---|---|---|---|---|---|
| Unitaria | Reglas de negocio puras, formateadores, cálculos | D09 · D10 · D11 | | CI | |
| Integración | Persistencia y servicios reales | D10 · D11 | | CI | |
| Contrato | Fronteras productor/consumidor (esquema, versión, idempotencia, auth) | D10 · D19 | | CI | |
| E2E | Recorridos críticos de punta a punta | D14 | | CI | |
| Seis estados | Carga · vacío · error · sin conexión · éxito · permiso insuficiente, en ejecución | D14 · D06 | | CI | |
| Formularios | Tres capas de validación, conservación de lo escrito, doble envío | D14 | | CI | |
| Permisos y tenant | Intentos de cruzar el límite por API directa, no por la interfaz | D14 · D12 | | CI | |
| Regresión visual | Referencias versionadas en 390 / 430 / 768 / 1024 / 1440 | D14 · D05 | | CI | |
| Accesibilidad | Automática más teclado y lector | D07 | | CI · manual | |
| Seguridad | Dependencias, secretos, cabeceras | D12 | | CI | |
| Rendimiento | Presupuesto declarado, carga | D15 | | CI · staging | |
| Exploratoria con carta | Riesgo alto o poco modelado, caja de tiempo | D14 | | manual | |
| Pantallas y módulos ("nada abajo") | `departments/D14-qa/checklists/screen-module-matrix-qa.md` | D14 | | CI | |
| Aceptación (UAT) | Aceptación del dueño de producto o usuarios reales | persona | | manual | |

**Técnicas de diseño de casos:** partición de equivalencia · valores límite · tablas de decisión · transición de estados · negativos y de permiso · concurrencia e idempotencia · cartas exploratorias. Cada RF con regla de negocio lleva al menos un caso límite y un caso negativo.

## 4. Criterios de entrada, salida, suspensión y reanudación

**Entrada** (Definition of Ready de D14)

- [ ] Cada RF tiene criterio de aceptación verificable (si no, se abre `Q-nnn` con D01 y no se prueba)
- [ ] Build exacto desplegado en un entorno de prueba autorizado (§7)
- [ ] Pruebas unitarias de D09/D10 corriendo en CI
- [ ] Datos de prueba listos y aislados (§8)
- [ ] Modelo de amenazas y mapa de permisos de D12 entregados (R2+)
- [ ] Matriz pantalla × estado de D05/D06 entregada

**Salida** (alineada a G5; cada umbral numérico es obligatorio)

- [ ] 100 % de los RF Must con al menos un `TC` ejecutado y resultado registrado (un caso "no ejecutado" no cuenta como pasado)
- [ ] Tasa mínima de aprobación de los casos ejecutados: ____ %
- [ ] Recorridos críticos cubiertos por E2E en CI
- [ ] Los seis estados verificados en ejecución, no solo en diseño
- [ ] Accesibilidad automática más teclado y lector
- [ ] Seguridad: dependencias, secretos, permisos y cabeceras
- [ ] Rendimiento dentro del presupuesto declarado
- [ ] Ninguna pantalla con 404, 500 o pantalla en blanco (veto de D14)
- [ ] Cero P0 abiertos; cada P1 con plan, dueño, fecha y aceptación independiente
- [ ] Inestabilidad (flakiness) máxima: ____ %; cada cuarentena con dueño, razón, fecha y cobertura alternativa
- [ ] Informe de cierre emitido

**Suspensión:** <condiciones, p. ej. build no desplegable, entorno caído, P0 bloqueante, datos contaminados>
**Reanudación:** <qué evidencia permite reanudar>

## 5. Trazabilidad requisito → caso

| RF / NFR | Riesgo (`RSK`) | `TC-nnn` | Nivel | Estado del caso |
|---|---|---|---|---|
| | | | | por diseñar · diseñado · automatizado |

Un RF Must sin `TC` bloquea la entrada a F5. Un `TC` sin RF, NFR, `THR` o `RSK` de origen se elimina o se justifica.

### Catálogo de casos

| TC | Origen | Nivel | Tipo (positivo · negativo · límite · permiso · estado · concurrencia · exploratorio) | Datos y rol (`DAT` · rol · tenant) | Entorno (`ENV`) | Resultado esperado (estado final persistido, no el mensaje en pantalla) | Prueba automatizada (`ruta::nombre`) | Responsable |
|---|---|---|---|---|---|---|---|---|
| TC-001 | | | | | | | | |

### Matriz recorrido × seis estados

| Recorrido (`JRN-nnn`) | Carga | Vacío | Error | Sin conexión | Éxito | Permiso insuficiente |
|---|---|---|---|---|---|---|
| | `TC-nnn` · `N/A: razón` | | | | | |

### Pantallas y módulos ("nada abajo")

| Ruta o pantalla | Carga sin 404/500/pantalla en blanco | Filtros y búsqueda (límites) | Funciones críticas con prueba unitaria | Overlays (foco, `Escape`, limpieza) |
|---|---|---|---|---|
| | `TC-nnn` | `TC-nnn` · `N/A: razón` | | |

## 6. Gestión de defectos

- **Severidad:** P0 pérdida de datos, acceso indebido, cobro incorrecto, caída total o riesgo legal · P1 bloquea un recorrido principal o el lanzamiento · P2 degrada calidad · P3 mejora (`core/evidence-contract.md`).
- **Reporte reproducible** (obligatorio): título · severidad · entorno y build · pasos exactos · dato exacto · esperado vinculado a RF · real · evidencia · frecuencia.
- **Quién corrige:** el departamento dueño del defecto. D14 reproduce y documenta; no corrige lo que encuentra.
- **Cierre:** un bug cerrado deja una prueba nueva corriendo en CI.
- **Riesgo residual:** lo acepta una persona con autoridad por escrito; D14 no lo acepta ni firma G5.

## 7. Entornos

| ID | Propósito | Versión desplegada | Paridad con producción (diferencias declaradas) | Aislamiento de producción | Cuentas (por rol y tenant; nunca administrador para probar restricciones) | Dueño | Listo (evidencia) |
|---|---|---|---|---|---|---|---|
| ENV-001 | | | | | | | EV-nnn |

## 8. Datos de prueba

| ID | Conjunto | Origen (sintético · anonimizado y autorizado; nunca volcado directo de producción) | Volumen | Aislamiento (namespace) y limpieza segura | ¿Datos personales? (minimización) | Dueño |
|---|---|---|---|---|---|---|
| DAT-001 | | | | | | |

## 9. Roles, calendario y métricas

| Rol | Persona o departamento | Responsabilidad |
|---|---|---|
| | | |

| Hito | Fecha | Condición |
|---|---|---|
| Plan congelado | | |
| Entrada a F5 | | |
| Informe de cierre | | |

Métricas que se reportan: RF Must verificados / total · casos ejecutados / planeados · defectos por severidad · inestabilidad · tiempo del pipeline de pruebas. Ninguna se usa como meta individual.

## 10. Criterios de hecho del plan

- [ ] Alcance con exclusiones razonadas por riesgo
- [ ] Riesgos de producto puntuados y enlazados a su respuesta de prueba
- [ ] Cada nivel aplicable tiene responsable, herramienta y lugar de ejecución
- [ ] Criterios de entrada, salida, suspensión y reanudación con umbrales numéricos
- [ ] Todo RF Must tiene al menos un `TC` trazado
- [ ] Matriz recorrido × seis estados y matriz de pantallas y módulos sin celdas vacías
- [ ] Entornos y datos definidos, aislados de producción
- [ ] Plan revisado por D00 y aceptado por la persona de `aprobador_humano`

## 11. Firmas

| Rol | Quién | Fecha | Handoff / revisión (`HND-nnn`) |
|---|---|---|---|
| Produce | D14 | | |
| Revisión independiente (registro) | D00 | | |
| Acepta el plan y lo excluido | `aprobador_humano` (frontmatter) | | enlace a la aprobación |

## Evidencia

> Solo artefactos generados por herramienta: ejecución de CI con commit, reporte de la
> herramienta de pruebas, captura fechada. "Lo probé" no cuenta (`core/evidence-contract.md`).
> Lo no ejecutado o no accesible se escribe `no verificado` con su razón.
> Ruta relativa a la raíz del proyecto (normalmente `.viltrum/evidence/…`) y `sha256:<64 hex>`
> (`sha256sum <ruta>`) o SHA de commit. Sin ruta y hash, la fila no es evidencia.

| ID | Respalda | Tipo | Ruta o URL | sha256 / commit | Fecha (UTC) | Generada por |
|---|---|---|---|---|---|---|
| EV-001 | listo del entorno `ENV-001` | | | | | |
