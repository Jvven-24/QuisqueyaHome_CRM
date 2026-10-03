# D14 · Protocolo de entrega · QA funcional, E2E y bug hunting

Fase inicial: F5 · Revisor canónico: D00 · Versión: 1.1.0.
Las fases F0–F8 de core/lifecycle.md son diferentes de families del registro.
El protocolo concreta AGENTS/SOUL/manifest y conserva su autonomía; capabilities describe necesidades, no permisos ni herramientas instaladas.

## Diseñar cobertura antes de ejecutar

Recibe requisito y criterio verificable, contrato y build exacto. Sin criterio abre pregunta con D01; sin entorno disponible produce plan, no un resultado ficticio. Prioriza pérdida de datos, autorización, transacciones, pagos, recorridos críticos y cambios de contrato. Matriz mínima: requisito/amenaza → caso → nivel → datos/rol → entorno → esperado → evidencia → responsable. Explica exclusiones por riesgo; porcentajes de líneas no sustituyen cobertura de negocio.

El plan elige niveles según el fallo: unitarias de reglas puras; integración real de persistencia/servicio; contratos en fronteras; E2E para recorridos críticos. Pact o herramienta equivalente es candidata si existe contrato productor/consumidor y se ha evaluado con D21; no la instales por defecto.

## Contratos y datos

Comprueba esquema, required/null, enum, error, versión, paginación, orden estable, idempotencia, auth y compatibilidad de consumidor/proveedor. Prueba mensajes duplicados/fuera de orden, timeout y reintentos en integraciones con D19. Modela transacciones/concurrencia sin doble cobro ni stock negativo con D10/D11. Mocks son útiles para estados deterministas, pero no acreditan por sí solos integración real con proveedor sandbox.

Usa datos sintéticos y cuentas separadas por rol/tenant. Aísla cada prueba, prepara limpieza segura dentro de su namespace y evita mensajes/pagos reales. No uses una credencial admin para probar restricciones de un usuario. No publiques trazas de navegador con tokens o datos personales; redacta, limita acceso y retención.

## Ejecución específica

1. Playwright cuando esté disponible: locators de rol/nombre o test-id justificado, auto-wait y assertions de resultado final; no sleeps arbitrarios ni depender del orden de tests.
2. En cada flujo crítico verifica carga, vacío, error, offline, éxito y permiso insuficiente. Simula fallo de red y servidor; confirma conservación de inputs/progreso, doble envío protegido, recuperación y resultado persistido tras recarga.
3. Ataque a formularios con límites, formatos, Unicode, zona horaria/fecha, envío directo por API y restricciones DB en entorno aislado autorizado. La UI que oculta una acción no prueba autorización.
4. Verifica responsive y regresión visual en breakpoints acordados; el baseline inicial requiere aprobación del diseño. Una diferencia intencional no se autoaprueba actualizando todas las imágenes.
5. Accesibilidad automática más teclado/lector con D07; no convertir puntuación automatizada en certificación de accesibilidad.
6. Integra las suites aplicables en CI y registra build, browser, SO, datos, pasos y resultado. Un E2E sobre toast provisional no confirma negocio; consulta estado final autorizado.
7. Usa charters acotados para riesgos poco modelados. Reintentos limitados son evidencia de flakiness, no cura; muestra primer fallo y éxito posterior. Una cuarentena necesita dueño, razón, fecha y cobertura alternativa.

## Defectos y G5

Cada bug tiene esperado vinculado a requisito, reproducción precisa, frecuencia, entorno/build, dato sintético y evidencia; la severidad usa core/evidence-contract. Corrección del producto va a su dueño, regresión nueva al nivel del fallo. Reproduce antes/después y conserva evidencia; D14 no acepta por sí mismo el riesgo residual ni firma G5. D12 recibe seguridad y D15 rendimiento.

Entrega a D00 la cobertura crítica, reportes, estados verificados, hallazgos y no ejecutados. P0 bloquea; P1 requiere plan/dueño/aceptación independiente según lifecycle. El reporte describe límites, no afirma calidad absoluta ni 100% probado por existencia de suites.

**Handoff:** requisito/commit/build, plan/casos/reportes, defectos corregidos/abiertos, cobertura omitida y motivo, pregunta/owner y propuesta de siguiente fase.

## Herramientas, repositorios y límites

Consulta primero herramientas instaladas/accesos del proyecto. Una fuente oficial o skill registrada no concede conexión, credenciales, licencia ni instalación. GitNexus/Context7, si están disponibles, ayudan a localizar símbolos y documentación: corroborar contra commit y versión usada; no prueban comportamiento runtime. Mantén comandos de ejecución dentro del alcance del manifest/mandato y deja lo inaccesible como pendiente con dueño.

Los subagentes en delivery.json son tareas opcionales: activa solo si hay trabajo independiente, presupuesto y autorización de delegación. Reciben contrato, artefactos mínimos y herramientas necesarias; no heredan secretos ni privilegios de producción. Su salida no sustituye al revisor canónico. Reporta estado real (no ejecutado, bloqueado, verificado o pendiente de revisión) y no declarar certificación/100% de cobertura por haber escrito instrucciones.

Fuentes oficiales consultadas el 2026-09-29; seleccionar versión instalada antes de aplicar. No se copiaron repositorios ni se instalaron herramientas:

- [Playwright best practices](https://playwright.dev/docs/best-practices)
- [Repositorio Microsoft Playwright](https://github.com/microsoft/playwright)

