# D09 — Entrega frontend por recorrido completo

F4; revisor **D14**, con D07 para accesibilidad y D15 para rendimiento. Implementar producto después de C1 y contratos/diseño aprobados correspondientes al recorrido. Producción requiere autorización humana explícita y handoff D16.

## Entrada

Mandato y commit, requisitos con criterios, contrato D03, API/schema D10, tokens y componentes D05, recorridos D04, matriz de seis estados D06, contenido D08 y catálogo de permisos. Inventariar framework/version, rutas, rendering SSR/CSR, bundler, lockfile, librería de estado, sistema de traducción, formularios y pruebas existentes. Reutilizar estructura compatible; evaluar reemplazo con D21/D03 cuando tenga impacto. No asumir React porque aparezca como fuente de referencia.

## Procedimiento

1. Seleccionar una porción vertical de valor: ruta → interacción → operación → estado posterior. Separar componentes, conexión a estado, dominio de cliente, capa de datos y adaptadores. Mantener reglas autoritativas en servidor; decisiones de presentación no equivalen a permisos efectivos.
2. Consumir types y validación desde contrato compartido o generado; validar respuestas en la frontera cuando sea pertinente. Schema y generación tienen versión/hash para detectar drift. Definir serialización de fechas, decimales, campos opcionales, enums desconocidos y errores públicos. En backend de otro lenguaje, el contrato generado sustituye compartir una librería incompatible.
3. Implementar **carga, vacío, error, sin conexión, éxito y permiso insuficiente** por pantalla y acción. Precisar el comportamiento de datos parciales y stale, carga incremental, caducidad de sesión, 404, 409/412 y timeout con resultado desconocido. Error recuperable preserva el borrador; éxito se confirma con servidor. Evitar que el botón de retry duplique una mutación.
4. Estado servidor vive en caché con clave `(tenant, identidad/alcance, recurso, parámetros)`, invalidación y política de antigüedad. Cancelar solicitudes obsoletas y evitar que resultados fuera de orden reemplacen el estado nuevo. Al salir/cambiar tenant, vaciar datos y cancelaciones pendientes; SSR no comparte caché de usuario entre requests. Tratar invalidación tras mutación y actualizaciones optimistas con rollback ante conflicto.
5. Formularios incluyen labels, mensajes i18n, foco del primer error, restricciones/máscaras D05, formatos de país y validación cliente/servidor coherente. Evitar doble submit; distinguir guardado en curso, guardado confirmado y fallo. La restauración de borradores tiene retención y alcance; no guardar secretos/datos sensibles en almacenamiento del navegador como atajo. Datos personales requieren política explícita.
6. Seguridad: no secretos privados en bundle, encoding según contexto, sanitización cuando se permita HTML, upload con verificación server, endpoints detrás del adaptador. Coordinar cookie/session/CSRF con D10/D12; no decidir almacenamiento de tokens por comodidad. Ocultar acciones no reemplaza prueba de permiso server. Revisar navegación directa a rutas, descarga/export y session expiry.
7. Accesibilidad y comportamiento: semántica, teclado, orden y retorno de foco, mensajes live, reduced motion, zoom y contraste. Comprobar cinco anchos de referencia y tamaños intermedios si aparece overflow. D07 verifica manualmente; capturas bonitas no acreditan accesibilidad. Cubrir texto largo, traducciones, datos vacíos, imágenes fallidas y contenido de usuario.
8. Rendimiento: aplicar carga por ruta, tamaño de imagen y bundle, caché y evitar cascadas tras medición. Presupuesto por ruta especifica objetivo acordado, dispositivo/red, dataset, instrumento y ambiente. Registrar tamaños y tiempos reales, sin confundir medición local con datos de campo de D15. Si no existe objetivo, marcar pregunta y resultado provisional.
9. Funcionalidad IA recibe estados D18: streaming parcial, cancelación, límite de costo, rechazo seguro y fallback. Renderizar salida como datos no confiables; herramientas privilegiadas se ejecutan server. La interfaz no inventa fuentes, aprobaciones ni éxito de acciones automáticas.

## Evidencia y handoff

Por recorrido, matriz `REQ → componente/ruta → escenario → evidencia → resultado` con commit, ambiente, fixtures sin PII y limitaciones. Ejecutar checks disponibles del proyecto y pruebas relevantes de reglas/casos límite; adjuntar capturas por estado/ancho y repro de fallos. Verificar control de requests concurrentes, caché al cambiar tenant y mutación duplicada cuando apliquen. Entregar a D14 con pendientes, contratos modificados y guía de reproducción; D12 recibe hallazgos de seguridad y D15 mediciones.

Aceptar solamente tras D14 independiente y controles de D07/D15 aplicables; no registrar un criterio como probado si solo se escribió. Un subagente puede capturar rutas/estados ya implementados con permisos del ambiente aislado y sin ejecutar compras/envíos reales. Sus artefactos no constituyen aceptación de D14.

## Herramientas

GitNexus para contexto/index vigente; Context7 para documentación compatible con lockfile; CLI/build/typechecker del proyecto y browser/Playwright disponibles para evidencia. Si no están, registrar requisito faltante y trabajar con inspección local sin afirmar verificación ejecutada. No agregar dependencias de frontend sin necesidad del recorrido y revisión de licencia/version.

Fuentes verificadas 2026-09-29: [React como referencia opcional](https://react.dev/reference/react), [OpenAPI](https://spec.openapis.org/oas/v3.1.1.html), [Context7](https://github.com/upstash/context7), [GitNexus](https://github.com/abhigyanpatwari/GitNexus).
