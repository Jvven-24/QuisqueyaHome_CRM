# T-W3-D05-B · UX visual + capa visual de los sistemas open source integrados

Perfil: **D05 UI / Design System** (con D04 y D19 para el contrato de datos). Modo: analysis. Revisor: D07.
Mismo método, base y librería que `tareas/T-W3-D05-ux-visual-A.md` (léelo: pasos 1–3 y reglas son iguales).
Capturas en `.viltrum/vre-os/capturas/B/`. Arquitectura: `.viltrum/vre-os/ARQ-VRE-002-integraciones.md`
(la UI de un sistema externo **nunca** se incrusta: se reproduce en nuestro frente con nuestros tokens, alimentada por
su adaptador/puerto). Registro de candidatos: `.viltrum/vre-os/oss-registry.json`.

## Módulos y su sistema detrás
| Módulo nuestro | Sistema open source detrás | Puerto | Qué pantalla nuestra lo representa |
|---|---|---|---|
| Propiedades + Rentas | OpenProperty (portado, MIT) | repositorio propio | inventario por torre/estado, contratos, cobros, mantenimiento |
| Agenda | Cal.com / Schedule-X | `AgendaPort` | calendario semana/mes, reserva de visita, recordatorios |
| Academy | **Moodle** (GPLv3, servicio aparte) | `AprendizajePort` | catálogo de cursos, progreso por broker, certificados, ranking |
| Comunicaciones | Chatwoot / Evolution API | `MensajeriaPort` | bandeja compartida, hilo por lead, plantillas |
| Configuración → Integraciones | todos (Twenty, Moodle, mensajería) | `salud()` de cada puerto | estado de cada conexión, outbox/DLQ, reintentar |
| Contactos / Pipeline (motor) | Twenty (headless) | `CrmPort` | (ya en A) timeline y vistas guardadas |

## Para cada fila
1. Captura nuestra pantalla actual (si existe) y **mira** la UI del sistema open source (capturas oficiales de su
   web/README/docs; cita la URL) para entender qué capacidades ofrece.
2. Elige en la librería Viltrum Design 1–2 componentes por id para reproducirlas con nuestro estilo.
3. Especifica la pantalla nuestra con tabs, móvil (tarjetas + hoja inferior), seis estados (incluido "proveedor
   caído": la pantalla sigue útil con datos locales y muestra el estado de la conexión) y **el contrato de datos**
   que el puerto debe devolver (campos, sin tipos del proveedor).
4. Wireframe ASCII a 390 y 1440.

## Entregable
`.viltrum/vre-os/D05-ux-modulos-B.md`, una sección por fila y `## Fuentes`.
