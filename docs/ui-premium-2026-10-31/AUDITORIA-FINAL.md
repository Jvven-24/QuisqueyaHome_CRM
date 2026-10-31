# Confirmación visual en compilación estable · 31/10/2026

Auditor `premium_auditor`, distinto de los productores, mismo proveedor del host. Esta inspección no se atribuye a Claude/Gemini ni sustituye la revisión por otro proveedor exigida para aceptación formal.

Servidor inspeccionado: `http://127.0.0.1:9305`, compilación `.next-premium` preparada por el principal. Sesión real de administrador con archivo de acceso privado externo; no acceso de evaluación. No se modificaron datos de negocio.

## Recorrido

13 rutas en320/390/1440: Inicio, Leads, Contactos, Proyectos, Agenda, Brokers, Comunicaciones, Reportes, Metas, Avances, Academy, Aprobaciones y Configuración.

Resultados combinados de `output/playwright/premium-final/results.json` y `premium-final-reportes/results.json`: **39/39 visitas HTTP200 con contenido renderizado, cero pageerrors, cero HTTP>=400 y cero desbordamientos no contenidos detectados por geometría**. La CSS histórica que oculta overflow horizontal limita esta última conclusión; por eso se inspeccionaron además los diálogos visualmente.

Reportes tiene un h1 de impresión oculto antes del encabezado visible. El scanner inicial esperaba el primer h1 y dio tres timeouts de instrumentación; se corrigió a `h1:visible` y se repitió solo Reportes, que pasó3/3. Las excepciones `Invalid or unexpected token` del recorrido dev no reaparecieron en compilación estable.

La navegación hasta contenido e inactividad de red (incluye espera fija de Playwright, no es TTI) tuvo mediana1370ms, máximo2079ms. No comparar directamente con las latencias de compilación dev como una mejora de rendimiento del código.

## Overlays y teclado

Evidencia: `output/playwright/premium-final320/overlays.json` y PNG.

- Lead y Contacto320x500: cierre top25/bottom73, acciones top435/bottom483, dentro del viewport y reciben el puntero. Cuerpo desplazable; Escape cierra.
- Nuevo Proyecto legacy320x500: contenedor top40/bottom500, scroll propio; Cerrar/Cancelar/Crear alcanzables mediante scroll y reciben el puntero. El dock ya no se interpone.
- Menú Más: el fondo no se desplazó; en anclaje parcial, último enlace «Portal Web» top792/bottom836 en viewport844, dentro del scrollport426px. ScrollTop1330 sobre scrollHeight1756. Escape cierra.
- Automatizaciones: dos ArrowRight consecutivos llevaron URL, foco y `aria-selected` a Monitor y Copiloto, respectivamente.

## Distribución observada

Capturas viewport actualizadas: `output/playwright/premium-final/inicio-390.png`, `leads-390.png`, `propiedades-390.png`; todos los módulos tienen también320/1440.

Medidas de documento a390px (longitud depende de registros; no equivalen por sí solas a calidad): Leads5463px, Contactos5417, Proyectos10552, Agenda2268, Brokers6801, Metas6447, Academy2627. La ronda dev anterior midió Leads6956, Metas8087 y Academy3085; muestra reducción de densidad, aunque las fuentes cambiaron concurrentemente y no es un experimento de rendimiento controlado. Inicio conserva2497px.

## Defecto detectado al inspeccionar captura

**Corregido y confirmado en r2 · PhoneInput320px.** En el formulario Lead, el selector de país heredaba ancho100% y el input telefónico quedaba fuera a la derecha, aunque los botones del formulario sí eran accesibles. Evidencia inicial `premium-final320/leads-modal-500.png`. Archivo: `src/components/ui/phone-input.tsx`. Tras la corrección, la compilación r2 en9305 coloca país left17/right129 (112px) y teléfono left135/right303 (168px), ambos dentro del diálogo320px. Se eligieron DO y US y se teclearon números sintéticos: máscaras `(809) 555-0123` y `(305) 555-0123`, valores completos ocultos con prefijo+1. Se cerró sin guardar. Evidencia `output/playwright/premium-phone-r2/results.json` y `phone-320x500.png`. No se repitió recorrido global.

## Confirmación r3 y servidor visible

El primer intento de r3 en9303 encontró el puerto ocupado por un proceso antiguo que seguía sirviendo `.next-prod` (r2). La inspección de HTML mostró las clases antiguas `line-clamp-2 max-sm:line-clamp-1` en la nota KPI, aunque el fuente y `.next-premium` ya estaban corregidos. El principal identificó `EADDRINUSE`, detuvo únicamente el proceso antiguo y levantó r3 correctamente en9303.

Recheck específico sobre9303 (sin repetir paseo global): la nota «Poblaciones distintas, no cohorte» está completa a390px (clientHeight36/scrollHeight36) y320px (54/54), overflow visible, line-clamp none y sin clases de truncado. Evidencia `output/playwright/premium-note-r3/results.json`, `inicio-390.png` y `inicio-320.png`. El campo de teléfono se reconfirmó en el mismo servidor: país112px y entrada168px dentro del modal320px, máscaras DO/US correctas, cierre sin guardar. Los defectos concretos detectados y comunicados en esta ronda quedaron corregidos en la versión local servida.

No se cierra issue, ficha ni gate desde este informe. Las capacidades simuladas y las conexiones OAuth sin credenciales siguen siendo limitaciones funcionales explícitas; el recorrido de lectura no verifica escrituras ni integraciones externas. Tampoco demuestra cobertura de todos los roles o de todas las rutas del CRM.
