# VRE-OS · Flujo por pasadas: especificar todo antes de construir

> D00 (Claude), 2026-10-04, a petición de Wilber: "varias pasadas para fijar la arquitectura sin errores, reglas de
> integración claras, especificación detallada de todas las pantallas, funciones, módulos, globales y conexiones,
> investigar lo que falte y dejar todo ready; revisar lo que el CRM puede reutilizar del CMS".

## 1. Diagnóstico del flujo hasta hoy (honesto)

| Síntoma | Causa | Coste |
|---|---|---|
| Seed con catálogos duplicados | D11 construyó sin inventario de catálogos existentes | 1 rework de 22 min |
| D09 empezó antes que D05 | Construcción y diseño en paralelo | rediseño sin especificación previa |
| D10/D19 sin informe | Tareas demasiado grandes para el tiempo | verificación manual del orquestador |
| Barrido de módulos con datos falsos | Investigación sin leer el código | 1 rework |
| Pantallas sin especificación | No existe un catálogo de pantallas y funciones | riesgo de "boceto" y retrabajo |

**Regla nueva:** nada se construye si su pantalla/función no está en el Spec Pack con estado `READY` (DoR, BP §69).
Lo ya despachado y especificado (T-W3-D09 Inicio/Reportes, T-W4b Rentas) termina; lo demás espera a P6.

## 2. Las pasadas (cada una cierra con puerta y revisor independiente)

| Pasada | Qué produce | Productor | Revisor | Puerta |
|---|---|---|---|---|
| **P0 · Inventario AS-IS** | Mapa real del CRM (rutas, pantallas, API, casos de uso, tablas, permisos, pruebas) con GitNexus + lectura de código; inventario del CMS (Quisqueya Studio) con lo reutilizable y lo duplicado | Codex Sol (CRM) · Antigravity (CMS) | el otro proveedor | G0 |
| **P1 · Arquitectura base** | ADR consolidados (ARQ-001 decisión, ARQ-002 integraciones), contextos delimitados, matriz de fuente de verdad final, convenciones de carpetas/nombres, **reglas de integración** numeradas y verificables por prueba | Codex Sol | **Wilber** + D03 | G2 |
| **P2 · Especificación funcional** | Una ficha por módulo y por función global con la plantilla `spec/_plantilla-modulo.md`: pantallas, funciones, entidades, permisos, estados, eventos, puertos, criterios de aceptación | Codex Sol (módulos de datos) · Antigravity (globales) | otro proveedor | G1 |
| **P3 · Especificación UX** | Por pantalla: estructura con tabs, móvil, componentes Viltrum Design por id, seis estados, wireframe 390/1440 (insumo: `D05-ux-modulos-A/B.md`) | Antigravity | D07 (Codex) | G3 |
| **P4 · Especificación de integraciones** | Una ficha por sistema externo con `spec/_plantilla-integracion.md`: puerto, contrato de datos, mapeo, eventos, fallos (BP §61), despliegue, licencia | Codex Sol | D12 | G2 |
| **P5 · Huecos** | Toda capacidad sin cubrir → investigación D21 con licencia verificada; decisión construir/integrar/portar | Antigravity | D03 | G2 |
| **P6 · Plan de construcción** | Tareas derivadas de fichas `READY`, con archivos permitidos, pruebas y revisor; oleadas | D00 (Claude) | Wilber | G4 |

Después de P6 se construye por oleadas como hasta ahora, pero cada `TAREA.md` cita su ficha y su criterio de aceptación.

## 3. Estructura del Spec Pack

```
.viltrum/vre-os/spec/
  00-indice.md                 # tabla de todas las fichas con estado DRAFT|REVIEW|READY|BUILT|VERIFIED
  _plantilla-modulo.md
  _plantilla-integracion.md
  arquitectura/                # P1: ADR, reglas de integración, convenciones, fuente de verdad
  inventario/                  # P0: crm-as-is.md, cms-reutilizable.md
  modulos/M01-leads.md ...     # P2+P3 (una ficha por módulo)
  globales/G01-shell.md ...    # P2+P3 (navegación, búsqueda, notificaciones, paleta, i18n, PWA, auditoría, ajustes)
  integraciones/I01-twenty.md  # P4
  huecos/                      # P5
```

Catálogo inicial de fichas (P2 lo confirma contra el inventario):
- **Módulos**: M01 Leads · M02 Contactos · M03 Pipeline · M04 Propiedades/Inventario · M05 Avances de obra ·
  M06 Agenda · M07 Tareas · M08 Brokers y co-broking · M09 Metas · M10 Comisiones · M11 Comunicaciones ·
  M12 Reportes · M13 Academy · M14 Configuración · M15 Rentas · M16 Cotizaciones y planes de pago ·
  M17 Reservas · M18 Client Room · M19 Deal Room · M20 Portal del broker · M21 Inicio (dashboard por rol).
- **Globales**: G01 Shell y navegación · G02 Búsqueda global y paleta de comandos · G03 Notificaciones ·
  G04 Autenticación, roles y alcance · G05 Auditoría · G06 i18n (es/en) · G07 PWA y sin conexión ·
  G08 Importación/exportación · G09 Deduplicación E.164 · G10 Integraciones y salud (outbox/DLQ) · G11 IA/asistente.
- **Integraciones**: I01 Twenty · I02 Moodle · I03 Mensajería (Chatwoot/Evolution/Baileys) · I04 Agenda
  (Cal.com/Schedule-X/iCal) · I05 Almacenamiento · I06 Portal Quisqueya (captura de leads) · I07 Motor de reglas
  (GoRules Zen) · I08 PDF (@react-pdf).

## 4. Reutilización del CMS (Quisqueya Studio, `QuisqueyaHome PortalWeb`)

Ya se sabe que el CMS tiene piezas que el CRM reimplementó o necesita (CommandPalette, DataTable, `tone.ts`,
explorador de Drive, enlaces de origen, i18n multi-idioma, cuenta/perfil de cliente, captura de leads del portal) y que
la skill `patron-consola` nació de esa consola. P0-CMS debe listar cada pieza con: ruta, qué hace, si el CRM ya tiene
equivalente, decisión (reutilizar como paquete compartido / copiar adaptando / ignorar) y riesgo de divergencia.
Regla: si la misma pieza existe en ambos, se extrae a un paquete compartido o se declara una fuente y la otra la sigue.

## 5. Coste
P0–P5 son análisis: Codex Sol solo para lo que exige leer mucho código del CRM; Antigravity para inventario del CMS,
globales, UX y huecos. Claude escribe plantillas, índice y verifica por comandos (que cada ficha cumpla la plantilla).
