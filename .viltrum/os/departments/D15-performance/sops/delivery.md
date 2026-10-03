# D15 · Protocolo de entrega · Rendimiento, carga y confiabilidad

Fase inicial: F5 · Revisor canónico: D03 · Versión: 1.1.0.
Las fases F0–F8 de core/lifecycle.md son diferentes de families del registro.
El protocolo concreta AGENTS/SOUL/manifest y conserva su autonomía; capabilities describe necesidades, no permisos ni herramientas instaladas.

## Presupuesto y plan

D03 revisa este departamento; D01/D02 confirman demanda y D17/negocio el SLO. En F2 participa en presupuestos, en F5 demuestra capacidad y en F7 compara resultados de campo. Si falta tráfico real no inventes carga: propone escenarios explícitos como hipótesis para validación y conserva el gate pendiente. Define mezcla de operaciones, concurrencia/tasa de llegada, picos, duración, datasets, geografías, dispositivos y dependencias.

Antes de ejecutar declara endpoint/ambiente, ventanas, CPU/memoria/red/DB, costo máximo, tasa máxima, timeout, abort conditions y operador. Produce el plan a nivel A1; ejecuta mediciones solo en entorno sandbox/staging y alcance autorizados conforme a manifest. Producción requiere humano y D16; una prueba agresiva nunca es observación pasiva.

## Medición y carga

1. Captura baseline por commit/build y configuración: percentiles p50/p95/p99, tasa de errores, throughput, saturación, colas, pool y costo por operación. Un percentil aceptable con muchas peticiones fallidas no pasa. Muestra tamaño de muestra y ventanas.
2. Decide modelo abierto (tasa de llegada) o cerrado (usuarios virtuales) según demanda; advierte cuando el generador o sus conexiones son cuello de botella y cuando se descartan iteraciones. No reportes capacidad del servidor a partir de un generador saturado.
3. k6 permite checks funcionales y thresholds; un check fallido no garantiza por sí mismo exit no cero. Configura thresholds de latencia, error y checks según objetivos acordados; distingue fallo de herramienta de presupuesto incumplido.
4. Prueba carga sostenida, estrés, pico y resistencia para cambios de capacidad. Acota soak/costos y coordina el plan con D00; no ejecutar horas de carga sin límites. Si un escenario no aplica, requiere motivo y revisión D03, no omisión silenciosa.
5. Ejercita dependencias lentas, fallos parciales, retry storm, backpressure, pool exhaustion, cache fría/caliente e invalidación. Un timeout en proveedor accesorio debe respetar el contrato de degradación aprobado, sin duplicar escrituras.
6. Captura planes de consulta con D11; EXPLAIN ANALYZE ejecuta la sentencia, por lo que no lo uses sobre mutaciones o producción sin entorno/autorización adecuados. Reporta N+1, bloqueos y pool antes de recomendar índices/caché.
7. Compara antes/después en mismas condiciones y documenta diferencias si no es posible. D09/D10/D11 implementan el remedio; D03 decide límites arquitectónicos y D16 capacidad.

## Experiencia y SLO

Lighthouse CI mide laboratorio; RUM/CrUX muestran campo cuando hay muestra válida. Registra red/dispositivo y budgets acordados de recursos/LCP/INP/CLS; INP real necesita interacciones/medición adecuada, no un score Lighthouse como sustituto. Evalúa percentiles y segmentación según población, no promedio global. Un entorno pequeño de staging sirve para tendencia; no demuestra sin modelado la capacidad exacta de producción.

Entrega SLI e hipótesis de capacidad a D17; un SLO de negocio requiere dueño, ventana y definición de eventos elegibles/buenos. Error budget basado en eventos no se convierte a minutos salvo que el SLI sea temporal. Define impacto de caché y tolerancia de obsolescencia con negocio, no solo TTL.

## Entrega y gate

El paquete contiene plan, thresholds, target/build, versiones, datos sintéticos, comando sin secretos, condiciones, resultados y limitaciones. D03 revisa presupuesto/capacidad; D00 usa evidencia en G5 y D16/D17 reciben restricciones para release/operación. Cruce de presupuesto se registra bloqueante según lifecycle; no ajustar umbrales después para hacer verde el reporte.

**Handoff:** baseline/comparación/reportes, capacidad medida, cuellos de botella, recomendaciones con costo/evidencia, riesgos residuales y próximo ensayo.

## Herramientas, repositorios y límites

Consulta primero herramientas instaladas/accesos del proyecto. Una fuente oficial o skill registrada no concede conexión, credenciales, licencia ni instalación. GitNexus/Context7, si están disponibles, ayudan a localizar símbolos y documentación: corroborar contra commit y versión usada; no prueban comportamiento runtime. Mantén comandos de ejecución dentro del alcance del manifest/mandato y deja lo inaccesible como pendiente con dueño.

Los subagentes en delivery.json son tareas opcionales: activa solo si hay trabajo independiente, presupuesto y autorización de delegación. Reciben contrato, artefactos mínimos y herramientas necesarias; no heredan secretos ni privilegios de producción. Su salida no sustituye al revisor canónico. Reporta estado real (no ejecutado, bloqueado, verificado o pendiente de revisión) y no declarar certificación/100% de cobertura por haber escrito instrucciones.

Fuentes oficiales consultadas el 2026-09-29; seleccionar versión instalada antes de aplicar. No se copiaron repositorios ni se instalaron herramientas:

- [k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
- [Repositorio Grafana k6](https://github.com/grafana/k6)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Google SRE SLO alerting](https://sre.google/workbook/alerting-on-slos/)

