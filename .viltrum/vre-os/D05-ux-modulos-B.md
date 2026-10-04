# T-W3-D05-B · UX visual + capa visual de los sistemas open source integrados

**Perfil:** D05 UI / Design System
**Fecha:** 2026-10-04
**Revisor:** D07

---

## 1. Módulo: Propiedades + Rentas
### Proveedor Open Source: OpenProperty
**URL:** `https://github.com/openproperty/openproperty` (referencia base)
### Problemas de UX y Capacidades
- **Capacidades del proveedor:** Inventario, gestión de inquilinos, cobros, contratos, mantenimiento.
- Evidencia actual: `[Evidencia: .viltrum/vre-os/capturas/B/rentas-1440.png]`, `[Evidencia: .viltrum/vre-os/capturas/B/rentas-390.png]` (Actualmente carece de vista unificada y manejo de estados offline).

### Estructura Propuesta (Tabs)
- **Inventario:** Propiedades y unidades por torre.
- **Contratos:** Acuerdos activos e históricos.
- **Cobros:** Pagos pendientes y realizados.
- **Mantenimiento:** Tickets de servicio.

### Comportamiento Móvil
- **Vista Principal:** Tarjetas para unidades (`MobileBottomSheet` para filtros por estado o torre).
- **Acción Principal (FAB):** Nueva Unidad o Ticket.
- **Hoja Inferior:** Opciones rápidas (registrar pago, editar contrato).

### Componentes Elegidos
- `Advanced Data Grid` (Catálogo 725) para listado tabular complejo.
- `Property Card` (Catálogo 15024) para tarjetas individuales de unidades.
- **Normalización a tokens:** padding 8px, bordes suaves `rounded-sheet`.

### Seis Estados
- **Carga:** Tarjetas en esqueleto (shimmer).
- **Vacío:** Ilustración "Aún no hay unidades registradas".
- **Error de campo:** Borde rojo en inputs financieros con texto descriptivo inferior.
- **Error de servidor:** Toast de error al crear contrato.
- **Proveedor caído (Sin conexión):** La pantalla muestra datos cacheados locales, con badge naranja superior "Sincronización pausada (Modo Local)".
- **Éxito:** Toast verde "Pago registrado correctamente".

### Contrato de Datos (Puerto: `RentasPort`)
```typescript
interface Unidad {
  id: string;
  torre: string;
  numero: string;
  estado: 'disponible' | 'alquilada' | 'mantenimiento';
  precioMensual: number;
}
interface Contrato {
  id: string;
  unidadId: string;
  inquilinoId: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'activo' | 'vencido' | 'terminado';
}
interface Pago {
  id: string;
  contratoId: string;
  monto: number;
  fecha: string;
  estado: 'pagado' | 'pendiente';
}
```

### Wireframes ASCII
**1440px:**
```text
+-------------------------------------------------------------+
| Rentas | [Tabs: Inventario | Contratos | Cobros | Mantenim] |
|-------------------------------------------------------------|
| Torre A [Filtro: Disponibles]                 [+ Nueva Und] |
|                                                             |
| [Card: A-101 | Disp. | $1,200/mes ]                         |
| [Card: A-102 | Alqu. | $1,500/mes ]                         |
+-------------------------------------------------------------+
```
**390px:**
```text
+------------------------+
| Rentas          [Search|
+------------------------+
| [Tabs: Inv. | Cont. ]  |
|------------------------|
| A-101 (Disponible)     |
| $1,200/mes             |
| [Editar] [Alquilar]    |
|------------------------|
| A-102 (Alquilada)      |
| $1,500/mes             |
| [Ver Contrato]         |
+------------------------+
|          ( + )         |
+------------------------+
```

---

## 2. Módulo: Agenda
### Proveedor Open Source: Cal.com / Schedule-X
**URL:** `https://cal.com/` / `https://schedule-x.dev/`
### Problemas de UX y Capacidades
- **Capacidades del proveedor:** Calendario semanal/mensual, slots de disponibilidad, reserva de visitas, recordatorios.
- Evidencia actual: `[Evidencia: .viltrum/vre-os/capturas/B/agenda-1440.png]`, `[Evidencia: .viltrum/vre-os/capturas/B/agenda-390.png]`

### Estructura Propuesta (Tabs)
- **Mi Calendario:** Vista principal de eventos semanales.
- **Disponibilidad:** Configuración de horarios de trabajo.
- **Recordatorios:** Tareas y avisos automáticos.

### Comportamiento Móvil
- **Vista Principal:** Calendario en formato lista o agenda diurna.
- **Acción Principal (FAB):** Nuevo evento.
- **Hoja Inferior:** `MobileBottomSheet` para detalles del evento o reprogramación.

### Componentes Elegidos
- `Calendar View` (Catálogo 4086) para la grilla de agenda.
- `Event Chip` (Catálogo 819) para pildoras de eventos en el calendario.

### Seis Estados
- **Carga:** Grilla de calendario difuminada.
- **Vacío:** "No tienes eventos para hoy. ¡Día libre!".
- **Error de campo:** Resalte rojo si fecha de fin < fecha inicio.
- **Error de servidor:** "No se pudo sincronizar el evento".
- **Proveedor caído (Sin conexión):** Modo solo lectura basado en local con banner "Agenda desincronizada".
- **Éxito:** "Visita agendada con éxito".

### Contrato de Datos (Puerto: `AgendaPort`)
```typescript
interface Evento {
  id: string;
  titulo: string;
  inicio: string;
  fin: string;
  asistentes: string[];
  tipo: 'visita' | 'reunion' | 'recordatorio';
}
interface Disponibilidad {
  diasSemana: number[];
  horaInicio: string;
  horaFin: string;
}
```

### Wireframes ASCII
**1440px:**
```text
+-------------------------------------------------------------+
| Agenda | [Mi Calendario | Disponibilidad]       [+ Evento]  |
|-------------------------------------------------------------|
| Lun 12   | Mar 13   | Mie 14   | Jue 15   | Vie 16          |
| [Visita] |          | [Cierre] |          |                 |
| 10:00 AM |          | 11:00 AM |          |                 |
+-------------------------------------------------------------+
```
**390px:**
```text
+------------------------+
| Agenda          [ Hoy ]|
+------------------------+
| Lun 12 de Octubre      |
|------------------------|
| 10:00 AM - 11:00 AM    |
| [Visita: Torre B]      |
|------------------------|
| 02:00 PM - 03:00 PM    |
| [Llamada Cliente]      |
+------------------------+
|          ( + )         |
+------------------------+
```

---

## 3. Módulo: Academy
### Proveedor Open Source: Moodle
**URL:** `https://moodle.org/`
### Problemas de UX y Capacidades
- **Capacidades del proveedor:** Catálogo de cursos, seguimiento y certificación de brokers (progreso, ranking, cumplimiento obligatorio Ley 155-17).
- Evidencia actual: `[Evidencia: .viltrum/vre-os/capturas/B/academy-1440.png]`, `[Evidencia: .viltrum/vre-os/capturas/B/academy-390.png]`

### Estructura Propuesta (Tabs)
- **Mis Cursos:** Cursos matriculados y progreso.
- **Catálogo:** Cursos disponibles para inscripción.
- **Certificaciones:** Certificados emitidos y vencimientos.
- **Ranking (Admin/Líder):** Cumplimiento obligatorio por broker.

### Comportamiento Móvil
- **Vista Principal:** Tarjetas apiladas con barra circular de progreso por curso.
- **Hoja Inferior:** `MobileBottomSheet` para detalles del curso y lecciones.

### Componentes Elegidos
- `Course Card` (Catálogo 25010) para el catálogo y progreso visual.
- `Leaderboard Table` (Catálogo 11641) para ranking de brokers y certificaciones.

### Seis Estados
- **Carga:** Barras de progreso grises y animadas.
- **Vacío:** "No estás inscrito en ningún curso aún."
- **Error de campo:** N/A (mayormente solo lectura / acciones directas).
- **Error de servidor:** "Error al cargar tu progreso."
- **Proveedor caído (Sin conexión):** Los cursos muestran el progreso guardado localmente, con advertencia "Moodle temporalmente inaccesible. Datos en caché."
- **Éxito:** Animación de confeti "¡Curso completado y certificado emitido!".

### Contrato de Datos (Puerto: `AprendizajePort`)
```typescript
interface Curso {
  id: string;
  titulo: string;
  descripcion: string;
  obligatorio: boolean;
}
interface Matricula {
  cursoId: string;
  brokerId: string;
  progresoPorcentaje: number;
  estado: 'en_curso' | 'completado';
}
interface Certificado {
  id: string;
  brokerId: string;
  cursoId: string;
  fechaEmision: string;
  fechaVencimiento: string | null;
}
interface BrokerProgreso {
  brokerId: string;
  nombre: string;
  cumplimientoGlobal: number;
}
```

### Wireframes ASCII
**1440px:**
```text
+-------------------------------------------------------------+
| Academy | [Mis Cursos | Catálogo | Certificados | Ranking]  |
|-------------------------------------------------------------|
| Tus Cursos Activos:                                         |
| [Card: Ley 155-17 | Progreso: ====      50% | Obligatorio ] |
| [Card: Ventas 101 | Progreso: ========= 90% | Opcional    ] |
+-------------------------------------------------------------+
```
**390px:**
```text
+------------------------+
| Academy         [Tabs] |
+------------------------+
| Ley 155-17 (Obligat)   |
| [====        ] 50%     |
| [ Continuar Lección ]  |
|------------------------|
| Ventas 101             |
| [=========   ] 90%     |
| [ Continuar Lección ]  |
+------------------------+
```

---

## 4. Módulo: Comunicaciones
### Proveedor Open Source: Chatwoot / Evolution API
**URL:** `https://www.chatwoot.com/` / `https://github.com/EvolutionAPI/evolution-api`
### Problemas de UX y Capacidades
- **Capacidades del proveedor:** Bandeja compartida, hilo por lead, mensajería WhatsApp/Telegram, plantillas.
- Evidencia actual: `[Evidencia: .viltrum/vre-os/capturas/B/comunicaciones-1440.png]`, `[Evidencia: .viltrum/vre-os/capturas/B/comunicaciones-390.png]`

### Estructura Propuesta (Tabs)
- **Bandeja de Entrada:** Mensajes nuevos y no leídos.
- **Mis Conversaciones:** Hilos asignados al broker.
- **Plantillas:** Respuestas rápidas predefinidas.

### Comportamiento Móvil
- **Vista Principal:** Lista de chats estilo WhatsApp.
- **Acción Principal (FAB):** Nuevo mensaje.
- **Hoja Inferior:** Opciones de asignación de chat o uso de plantilla rápida.

### Componentes Elegidos
- `Chat List / Conversation` (Catálogo 764) para diseño unificado de chat.
- `Quick Reply Chips` (Catálogo 795) para atajos y plantillas.

### Seis Estados
- **Carga:** Lista de chats esquelética.
- **Vacío:** "Bandeja al día. No hay mensajes nuevos."
- **Error de campo:** Plantilla con variables faltantes resaltadas en rojo.
- **Error de servidor:** "Fallo al enviar el mensaje".
- **Proveedor caído (Sin conexión):** Mensajes enviados quedan en Outbox (ícono reloj). "Chat en modo offline."
- **Éxito:** "Mensaje enviado" (check verde/doble check).

### Contrato de Datos (Puerto: `MensajeriaPort`)
```typescript
interface Conversacion {
  id: string;
  leadId: string;
  canal: 'whatsapp' | 'web';
  estado: 'abierta' | 'resuelta';
}
interface Mensaje {
  id: string;
  conversacionId: string;
  remitente: 'broker' | 'lead';
  contenido: string;
  fecha: string;
}
interface Plantilla {
  id: string;
  titulo: string;
  contenido: string;
}
```

### Wireframes ASCII
**1440px:**
```text
+-------------------------------------------------------------+
| Chat | [Bandeja | Mis Conversaciones | Plantillas]          |
|-----------------------+-------------------------------------|
| [Lead 1] Whatsapp     |  Chat con Lead 1                    |
| [Lead 2] Web          |  > Hola, me interesa la torre B     |
| [Lead 3] Whatsapp     |  [ Input mensaje...       ] [Enviar]|
+-------------------------------------------------------------+
```
**390px:**
```text
+------------------------+
| Chat (3 sin leer)      |
+------------------------+
| [W] Lead 1             |
| Hola, me interesa...   |
|------------------------|
| [W] Lead 2             |
| Gracias por la info    |
+------------------------+
|          ( + )         |
+------------------------+
```

---

## 5. Módulo: Configuración → Integraciones
### Proveedor Open Source: Varios (Twenty, Moodle, Chatwoot)
### Problemas de UX y Capacidades
- **Capacidades del proveedor:** Monitorización de salud de conexiones, outbox / DLQ, control de reintentos.
- Evidencia actual: `[Evidencia: .viltrum/vre-os/capturas/B/integraciones-1440.png]`, `[Evidencia: .viltrum/vre-os/capturas/B/integraciones-390.png]`

### Estructura Propuesta (Tabs)
- **Estado de Conexiones:** Monitoreo y ping en vivo.
- **Outbox / DLQ:** Cola de mensajes/operaciones fallidas con acciones.

### Comportamiento Móvil
- **Vista Principal:** Tarjetas de estado (Verde = UP, Rojo = DOWN).
- **Hoja Inferior:** `MobileBottomSheet` para revisar el motivo de fallo en el DLQ y forzar reintento.

### Componentes Elegidos
- `Status Indicator Card` (Catálogo 875) para cada integración.
- `Data List with Actions` (Catálogo 725 adaptado) para el DLQ.

### Seis Estados
- **Carga:** Pings en curso (spinners en cada tarjeta).
- **Vacío:** DLQ limpio ("No hay eventos fallidos").
- **Error de campo:** Credenciales inválidas al configurar integración.
- **Error de servidor:** "No se pudo conectar con el proveedor".
- **Proveedor caído (Sin conexión):** Tarjeta en rojo, indicando la hora del fallo.
- **Éxito:** Tarjeta en verde ("Conexión estable"). "Evento reintentado con éxito."

### Contrato de Datos (Puerto: `IntegracionesPort`)
```typescript
interface IntegracionSalud {
  proveedor: string;
  estado: 'UP' | 'DOWN';
  latenciaMs: number;
  ultimoPing: string;
}
interface DlqEvento {
  id: string;
  proveedor: string;
  payload: any;
  error: string;
  fechaFallo: string;
}
```

### Wireframes ASCII
**1440px:**
```text
+-------------------------------------------------------------+
| Integraciones | [Estado de Conexiones | Outbox/DLQ ]        |
|-------------------------------------------------------------|
| [ Twenty (CRM)   [ UP ] 45ms  ]                             |
| [ Moodle         [ UP ] 120ms ]                             |
| [ Evolution API  [DOWN] Error ] -> [Reintentar]             |
+-------------------------------------------------------------+
```
**390px:**
```text
+------------------------+
| Integraciones          |
+------------------------+
| Twenty (CRM)           |
| [ Estado: UP ] 45ms    |
|------------------------|
| Evolution API          |
| [ Estado: DOWN ] Error |
| [ Diagnosticar ]       |
+------------------------+
```

---

## 6. Módulo: Contactos / Pipeline
*(Revisado en A, ver `.viltrum/vre-os/D05-ux-modulos-A.md`)*

---

## Fuentes
- Documento basado en `docs/DESIGN.md`, base `ARQ-VRE-002-integraciones.md`, catálogo `.viltrum/design/components` y los puertos diseñados en `src/application/`.
- Las capturas están depositadas en `.viltrum/vre-os/capturas/B/`.

## Handoff
D07, favor validar:
- Que los estados *offline/proveedor caído* con su respectiva información en caché cuenten con alertas `aria-live` claras para indicar al usuario que los datos pueden no estar sincronizados.
- Que el DLQ en móvil sea navegable y las acciones (Reintentar/Descartar) sean accesibles sin depender de swipe.
- Que el contraste de los badges semánticos (verde/rojo para UP/DOWN en integraciones) cumpla la norma AA.
