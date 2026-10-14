# Matriz de impacto por módulo (plantilla)

Dueño: D02. Se llena para cada funcionalidad después de expandir las ocho caras (`SKILL.md`, paso 4) y se adjunta a la
especificación. Las columnas "Entrega real" salen de `departments/Dxx/delivery.json` (`outputs`) y "Revisor" de `manifest.yaml`;
si cambian allí, cambian aquí (se relee, no se recuerda). Lo que no se haya verificado se marca `no verificado`.

## 1. Cabecera de etapa
```
Módulo: <nombre>            Mandato: <M-nnn>            Fecha:
Etapa vigente: <fase/gate leído de .viltrum/status.md y core/lifecycle.md> (fuente: archivo:línea)
C1 vigente: sí/no (.viltrum/commercial.md)   → sin C1, D09/D10/D11/D16/D18/D19 solo analizan
Rebanadas de ESTA etapa: <Dxx, Dxx...>       Rebanadas para la SIGUIENTE etapa: <Dxx... + condición que las activa>
```

## Profundidad según riesgo
Se decide con la clasificación del router (`core/routing.md`) y no corren 22 departamentos siempre.
- **R0-R1:** una línea por efecto externo (sección 2) y solo las filas D01-D22 afectadas; las demás se resumen en una línea "N/A: <razón con evidencia>" por grupo.
- **R2+ (dinero, datos personales, permisos, integraciones):** matriz completa, todas las filas y el cierre por rebanada.
Si dudas entre dos niveles, el más alto.

## 2. Efectos externos (lista mínima, no tope)
Cada línea lleva `sí` o `N/A` (un solo vocabulario) y una razón de una frase. `N/A` exige razón concreta con evidencia (archivo:línea o dato verificable);
sin ella cuenta como `sí` no analizado. Un `sí` nombra el departamento que lo cubre. El productor AÑADE los efectos que la lista no prevea.
| Efecto externo | sí/N/A | Razón / qué cambia | Cubre |
|---|---|---|---|
| Contenido / CMS (textos, medios, taxonomías, plantillas) | | | D08 · D09 · D10 |
| Base de datos y migración de datos existentes (backfill, compatibilidad) | | | D11 · D16 |
| Funciones, jobs, colas, tareas programadas | | | D10 · D19 |
| Integraciones y webhooks (entrantes y salientes) | | | D19 · D12 |
| Permisos y roles (catálogo, verificación en servidor y BD) | | | D10 · D12 |
| Idioma y SEO (catálogo de textos, URLs, indexación) | | | D08 · D09 |
| Analítica y eventos de conversión | | | D08 · D17 |
| Correos y notificaciones | | | D19 · D08 |
| Soporte y documentación (KB, guías, comunicación) | | | D20 |
| Reversión / rollback (de código, de datos, de configuración) | | | D16 · D11 |
| Legal, fiscal, financiero y cumplimiento (PCI, impuestos y facturación, Ley 172-13, términos y cancelación, contracargos, conciliación contable, costo/comisión del proveedor) | | | D12 · D02 · D20 · humano |
| Secretos, entornos y cuentas externas (cuenta de comerciante/proveedor, claves, sandbox vs producción: acción humana) | | | D16 · D12 · humano |
| <efecto añadido por el productor> | | | |

## 3. Tabla por departamento (D01..D22)
`Afectado` = `sí` o `N/A`. `N/A` exige razón concreta de este módulo con evidencia ("no hay datos nuevos: reutiliza la tabla X, archivo:línea"); no vale "no aplica".
Quien rechaza un `N/A` sin evidencia: el revisor de D02 (D01) y D00 al cerrar; la fila vuelve al productor.
En las filas `sí`, "Entrega para ESTE módulo" concreta el entregable genérico de la columna "Entrega real". "Entrada" es lo que necesita y de quién.
| Dpto | Entrega real (delivery.json) | Revisor | Afectado + razón | Entrega para ESTE módulo | Entrada que necesita |
|---|---|---|---|---|---|
| D01 Descubrimiento | PRD, mapa de actores/procesos, requisitos con criterio de aceptación, NFR medibles, trazabilidad | D02 | | | |
| D02 Alcance | prioridad y MVP, exclusiones y fases, rango/costos/supuestos, C1, impacto de cambios, go de negocio | D01 | | | |
| D03 Arquitectura | estimación pre-C1, arquitectura y diagramas, matriz requisito/módulo/contrato, contratos API/eventos y dueño de datos, ADR, migración y recuperación | human | | | |
| D04 UX research | hallazgos UX, inventario de vistas y matriz de roles, sitemap y recorridos críticos, wireframes | D05 | | | |
| D05 Sistema de diseño | tokens, catálogo de componentes y estados, especificación responsive por vista, prototipo, inventario reutilizar/adaptar/crear | D07 | | | |
| D06 Estados | matriz vista × acción × estado, catálogo de errores y recuperación, transiciones, plan por escenarios | D14 | | | |
| D07 Accesibilidad | matriz WCAG A/AA, hallazgos con evidencia, reporte automático, registro manual teclado/lector, retest | D14 | | | |
| D08 Contenido y SEO | mapa de contenido y copy, especificación SEO, eventos de conversión, plan de medición, revisión 30/60/90 días | D02 | | | |
| D09 Frontend | rutas y componentes, contratos consumidos, formularios y seis estados, evidencia por ancho/permiso/fallo | D14 | | | |
| D10 Backend | API/schema y servicios de dominio, matriz de permisos por recurso/tenant, idempotencia/transacciones/outbox, errores y auditoría | D12 | | | |
| D11 Datos | ERD/diccionario y constraints, políticas de acceso y retención, migraciones/backfill versionados, planes de consulta, restore/PITR | D12 | | | |
| D12 Seguridad | mapa de amenazas, matriz control → ASVS → evidencia, matriz de permisos, inventario de privacidad, hallazgos con dueño | human | | | |
| D13 Git | paquete de PR con evidencia, matriz check → SHA → resultado, protección de rama, versionado/changelog, plan de reversión | D03 | | | |
| D14 QA | plan de pruebas por riesgo, pruebas unitarias/integración/contrato/E2E, matriz recorrido × seis estados, bugs reproducibles | D00 | | | |
| D15 Rendimiento | plan de carga, baseline y comparación, reportes k6/Lighthouse, capacidad y punto de degradación, presupuesto y degradación | D03 | | | |
| D16 DevOps | ambientes y pipeline, manifiesto de release (SHA/config/migración), ensayo de migración y rollback, runbook, go/no-go | D12 | | | |
| D17 Observabilidad | mapa recorrido → señal → SLI/SLO → dueño, OpenTelemetry y privacidad, dashboards/alertas/runbooks, datos de producción para la revisión de resultados | D16 | | | |
| D18 IA y agentes | contrato de agente y estado, tools/ACL/guardrails, grounding/citas/fallback, dataset y resultados, budget y runbook | D12 | | | |
| D19 Integraciones | adaptador y schemas propios, verificación de firma y scopes, inbox/outbox/idempotencia, retry/DLQ, runbook | D12 | | | |
| D20 Documentación | README y documentación por audiencia, índice de ADR/contratos/runbooks, notas de versión y guía de migración, KB de soporte y escalación | D00 | | | |
| D21 Investigación | expediente construir/comprar/integrar, tabla comparativa, prueba acotada, licencia/mantenimiento/costo, contrato adaptador y plan de salida | D03 | | | |
| D22 Conocimiento | índice de fuentes y hashes, paquete de contexto por perfil, registro de contradicciones, trazabilidad/recencia, lecciones | D00 | | | |

D00 no tiene fila: coordina, no produce (lleva el cierre de la sección 4).

## 4. Cierre por rebanada
El módulo no se declara terminado hasta que, para cada fila `sí` de la etapa vigente, exista un handoff que **cite su fila** (Dpto + "Entrega para ESTE módulo")
y revisión de su revisor independiente; las filas `N/A` llevan su razón con evidencia; las de la siguiente etapa quedan listadas con su condición de activación.
| Dpto | Handoff (ruta) | Revisor y veredicto | Estado: cerrada / abierta / siguiente etapa / N/A (razón) |
|---|---|---|---|
| | | | |

Fila abierta o sin handoff que cite su fila = módulo no terminado. D00 lo comprueba contra esta tabla antes de proponer el gate.

## 5. Robusto y escalable "como en el mercado"
Por cada capacidad del módulo: >= 2 referencias reales con URL (paso 3 de `SKILL.md`) y los estados de cada componente
(seis estados de `core/doctrine/ux-states.md`; acciones y formularios con el contrato R1-R8 de esa misma sección, sin copiarlo aquí).
| Capacidad | Referencia 1 (URL) | Referencia 2 (URL) | Qué adoptamos / qué no y por qué | Estados cubiertos |
|---|---|---|---|---|
| | | | | |
