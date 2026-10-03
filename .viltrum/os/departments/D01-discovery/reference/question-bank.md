# Banco de preguntas — por tipo de solución y por módulo

> Resumen ejecutivo: este banco no se aplica completo nunca. D01 carga solo las secciones
> del tipo de solución clasificado (`core/routing.md` 1.2) y de los módulos que el
> proyecto activa. Cada pregunta lleva a quién se hace (`a:`) y qué puerta bloquea
> (`bloquea:`) para copiarse directo al formato de `.viltrum/questions.md`. El identificador
> real `Q-nnn` se asigna en el proyecto, no aquí.

Las preguntas marcadas **(*)** son las que una IA genérica normalmente no hace: retención
de datos, quién aprueba una excepción, volumen con número, qué pasa cuando falla algo,
excepción a la regla. Son las que más valor aportan y las que primero se saltan bajo
presión de tiempo.

---

## Parte 1 — Por tipo de solución (`core/routing.md` 1.2)

### Landing

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿El formulario de contacto guarda algún dato que requiera tratamiento especial (cédula, teléfono, correo)? (*) | cliente | G0 |
| ¿A dónde van los leads — CRM, correo, WhatsApp — y quién les da seguimiento? | cliente | G1 |
| ¿Existe una fecha o evento que hace que esta landing caduque o deba desactivarse? (*) | cliente | G1 |

### Corporativa

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Quién en el cliente tiene permiso de editar contenido después del lanzamiento, y con qué frecuencia lo hará? (*) | cliente | G1 |
| ¿Existen versiones en más de un idioma? ¿Cuáles son fuente y cuáles traducción? | cliente | G1 |
| ¿Hay contenido regulado (avisos legales, licencias, certificaciones) que deba mostrarse siempre? | cliente | G0 |

### E-commerce

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Cuál es el volumen esperado de pedidos por día en el pico del año, con número? (*) | cliente | G1 |
| ¿Qué pasa cuando el inventario llega a cero mientras alguien tiene el producto en el carrito? (*) | cliente | G1 |
| ¿Quién aprueba una devolución o un reembolso, y hasta qué monto sin escalar? (*) | cliente | G1 |
| ¿El impuesto se calcula por producto, por categoría o es uniforme? ¿Hay excepciones? | cliente | G1 |

### Portal / CMS

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Quién publica contenido sin revisión previa y quién necesita aprobación antes de publicar? (*) | cliente | G1 |
| ¿Cuánto tiempo se conserva el contenido despublicado antes de borrarse definitivamente? (*) | cliente | G1 |
| ¿Existen roles de editor por sección (solo puede editar su categoría, no todo el sitio)? | cliente | G1 |

### SaaS

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Cómo se factura — por usuario, por uso, por plan fijo — y qué pasa si un cliente se pasa del límite? (*) | cliente | G1 |
| ¿Qué le pasa a los datos de un cliente cuando cancela la suscripción? ¿Cuánto tiempo se conservan? (*) | cliente | G1 |
| ¿Hay un rol de soporte interno que puede entrar a la cuenta de un cliente? ¿Con qué rastro de auditoría? (*) | cliente | G1 |

### CRM / ERP

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Se migran datos de un sistema anterior? ¿En qué formato y con qué volumen exacto? (*) | cliente | G1 |
| ¿Qué campos son obligatorios para el negocio aunque el sistema anterior los tuviera vacíos? | cliente | G1 |
| ¿Quién puede ver el historial completo de un cliente y quién solo lo de su cartera? | cliente | G1 |

### Marketplace

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Quién es dueño del dato del comprador — la plataforma o el vendedor? (*) | cliente | G1 |
| ¿Cómo se resuelve una disputa entre comprador y vendedor, y quién decide en última instancia? (*) | cliente | G1 |
| ¿Cuál es la comisión de la plataforma y cómo y cuándo se liquida a cada vendedor? | cliente | G1 |

### App móvil

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿La app debe funcionar sin conexión, aunque sea parcialmente? ¿Qué se pierde si no hay red? (*) | cliente | G1 |
| ¿Hay versión mínima de sistema operativo soportada, y qué pasa con dispositivos por debajo? | cliente | G1 |
| ¿Quién mantiene las cuentas de desarrollador de las tiendas (Apple, Google) y qué pasa si esa persona se va? (*) | cliente | G0 |

### Dashboard

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Cada cuánto se actualizan los datos que muestra — tiempo real, cada hora, diario? | cliente | G1 |
| ¿Qué pasa cuando la fuente de datos falla — se muestra el último dato conocido o un error? (*) | cliente | G1 |
| ¿Distintos roles ven distintos recortes de los mismos datos, o todos ven lo mismo? | cliente | G1 |

### Automatización

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué pasa si el proceso automatizado falla a la mitad — se reintenta, se revierte, se avisa a alguien? (*) | cliente | G1 |
| ¿Quién es notificado cuando la automatización se detiene, y en cuánto tiempo debe actuar? (*) | cliente | G1 |
| ¿Existe un caso donde el proceso debe hacerse manualmente aunque exista la automatización? | cliente | G1 |

### Integración API

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué pasa si el sistema externo está caído — se reintenta, se encola, se pierde el dato? (*) | cliente | G1 |
| ¿Quién es dueño de la cuenta/API key del sistema externo y qué pasa si expira? (*) | cliente/proveedor | G1 |
| ¿Hay límite de peticiones (rate limit) del proveedor, y qué tan cerca está el volumen esperado de ese límite? | proveedor | G1 |

### Sistema interno

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Cuántos usuarios internos lo usarán, con número, y crecerá ese número en el próximo año? (*) | cliente | G1 |
| ¿Qué sistema reemplaza, y qué pasa con los datos históricos de ese sistema? | cliente | G1 |
| ¿Hay dependencia de un proceso manual (Excel, papel) que debe seguir funcionando en paralelo durante la transición? (*) | cliente | G1 |

### Plataforma con pagos

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Quién es el procesador de pagos, y quién asume la responsabilidad de PCI-DSS? (*) | cliente | G0 |
| ¿Qué pasa con un pago que se cobra pero cuya operación falla después (reversa, crédito, reintento)? (*) | cliente | G1 |
| ¿Hay conciliación contable automática, o es manual? ¿Quién la hace y con qué frecuencia? | cliente | G1 |

### Tiempo real / IoT

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué pasa cuando un dispositivo pierde conexión — se descarta el dato, se encola, se marca como desactualizado? (*) | cliente | G1 |
| ¿Cuál es la latencia máxima aceptable entre el evento real y su reflejo en el sistema, con número? | cliente | G1 |
| ¿Quién es responsable de un dispositivo que reporta datos incorrectos de forma sostenida? (*) | cliente | G1 |

### Solución IA / RAG

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué pasa cuando el modelo no sabe la respuesta — inventa, dice "no sé", escala a un humano? (*) | cliente | G1 |
| ¿Qué datos del cliente puede ver el modelo, y hay algo que explícitamente no debe ver? (*) | cliente | G0 |
| ¿Quién revisa las respuestas antes de que el sistema tenga autonomía total, y durante cuánto tiempo? | cliente | G1 |

---

## Parte 2 — Por módulo activable

### Auth / RBAC

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Cuántos roles existen y qué puede hacer cada uno, en una matriz, no en prosa? | cliente | G1 |
| ¿Qué pasa cuando alguien pierde el rol que tenía — se le revoca inmediato o al cierre de sesión? (*) | cliente | G1 |
| ¿Hay autenticación de dos factores obligatoria para algún rol? | cliente | G1 |
| ¿Cuánto dura una sesión antes de expirar, y qué pasa con el trabajo no guardado al expirar? (*) | cliente | G1 |

### Perfiles

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué campos del perfil son públicos, cuáles privados y cuáles solo el dueño puede ver? | cliente | G1 |
| ¿Un usuario puede tener más de un perfil o cuenta en el sistema? ¿Cómo se evita duplicidad? | cliente | G1 |
| ¿Qué pasa con el perfil cuando el usuario se da de baja — se borra, se anonimiza, se conserva? (*) | cliente | G1 |

### Billing / pagos

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué monedas se aceptan y cómo se maneja el tipo de cambio si hay más de una? | cliente | G1 |
| ¿Qué pasa con un cobro recurrente si la tarjeta del cliente expira o es rechazada? (*) | cliente | G1 |
| ¿Cuál es la política de reembolso — total, parcial, con plazo límite? | cliente | G1 |
| ¿Quién concilia los pagos contra el banco y con qué frecuencia? | cliente | G1 |

### Catálogo

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Cuántos productos o ítems habrá, con número aproximado, y quién los carga? (*) | cliente | G1 |
| ¿Hay variantes (talla, color) que comparten o no comparten inventario? | cliente | G1 |
| ¿Qué pasa con un ítem que se descontinúa — desaparece o queda visible como "no disponible"? | cliente | G1 |

### Búsqueda / filtros

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿La búsqueda debe tolerar errores de tipeo y sinónimos, o basta con coincidencia exacta? | cliente | G1 |
| ¿Qué filtros son obligatorios para el negocio, más allá de lo evidente? | cliente | G1 |
| ¿Qué se muestra cuando la búsqueda no encuentra nada — se sugiere algo o queda vacío? | cliente | G1 |

### CMS

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Quién aprueba contenido antes de publicarlo, si alguien lo hace? (*) | cliente | G1 |
| ¿Hay contenido programado para publicarse en una fecha futura? | cliente | G1 |
| ¿Qué pasa con las versiones anteriores de una página editada — se guardan, se pierden? | cliente | G1 |

### Archivos

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Cuál es el tamaño máximo de archivo y qué formatos se aceptan? | cliente | G1 |
| ¿Quién puede ver o descargar un archivo subido por otro usuario? | cliente | G1 |
| ¿Qué pasa si se sube un archivo malicioso o corrupto — hay validación antes de aceptarlo? (*) | cliente | G1 |
| ¿Cuánto tiempo se conservan los archivos después de que el registro asociado se borra? (*) | cliente | G1 |

### Notificaciones

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué eventos generan notificación, y el usuario puede desactivar cuáles? | cliente | G1 |
| ¿Qué pasa si el usuario no tiene canal disponible (correo inválido, sin WhatsApp) — se reintenta o se descarta? (*) | cliente | G1 |
| ¿Hay notificaciones que son obligatorias y no se pueden desactivar (seguridad, legal)? | cliente | G1 |

### Email / WhatsApp

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Quién es el proveedor autorizado (dominio verificado, número de WhatsApp Business) y quién lo administra? (*) | cliente | G0 |
| ¿Qué pasa cuando un correo rebota o un mensaje de WhatsApp falla — se reintenta cuántas veces? (*) | cliente | G1 |
| ¿Hay plantillas que deben aprobarse ante el proveedor antes de usarse (caso WhatsApp Business)? | proveedor | G1 |

### Calendario

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué pasa cuando dos eventos se solapan — se permite, se bloquea, se avisa? (*) | cliente | G1 |
| ¿En qué zona horaria se guarda y se muestra cada evento, si hay usuarios en distintas zonas? | cliente | G1 |
| ¿Cuál es la política de cancelación y quién es notificado cuándo se cancela? | cliente | G1 |

### Mapas

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué proveedor de mapas se usa, y qué costo tiene por volumen de consultas? | cliente | G1 |
| ¿Qué pasa si la geolocalización del usuario no está disponible o es imprecisa? | cliente | G1 |
| ¿Los datos de ubicación de un usuario se guardan históricamente o solo la última posición? (*) | cliente | G1 |

### Workflows / aprobaciones

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Cuántos niveles de aprobación tiene el proceso, y quién es cada aprobador? | cliente | G1 |
| ¿Qué pasa si un aprobador no responde en el tiempo esperado — escala automáticamente a quién? (*) | cliente | G1 |
| ¿Se puede saltar un paso de aprobación en un caso de excepción, y quién lo autoriza? (*) | cliente | G1 |

### Auditoría

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué acciones son obligatorias de auditar por regulación, y cuáles por decisión del negocio? | cliente | G1 |
| ¿Quién puede consultar la bitácora de auditoría, y puede alguien modificarla? (*) | cliente | G1 |
| ¿Cuánto tiempo se conserva el historial de auditoría? | cliente | G1 |

### Analytics

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué decisiones de negocio se van a tomar con estos datos — eso define qué se mide? | cliente | G1 |
| ¿Se recolectan datos personales para analítica? ¿Hay consentimiento explícito del usuario? (*) | cliente | G0 |
| ¿Qué tan desactualizado puede estar el dashboard antes de que deje de ser útil? | cliente | G1 |

### Export / import

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿En qué formato exacto debe poder exportarse la información, y quién lo va a consumir después? | cliente | G1 |
| ¿Qué pasa con una fila inválida durante una importación masiva — se rechaza todo el archivo o solo esa fila? (*) | cliente | G1 |
| ¿Hay límite de volumen por importación, y qué pasa si se excede? | cliente | G1 |

### Jobs / colas

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué pasa con un trabajo que falla — se reintenta cuántas veces, con qué espera entre intentos? (*) | cliente | G1 |
| ¿Quién es notificado cuando un trabajo falla definitivamente? (*) | cliente | G1 |
| ¿Hay trabajos que deben ejecutarse en un orden estricto, o pueden correr en paralelo? | cliente | G1 |

### Realtime

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Cuántos usuarios concurrentes deben recibir actualizaciones en tiempo real, con número? (*) | cliente | G1 |
| ¿Qué pasa si un usuario pierde la conexión en tiempo real — se reconecta solo, se pierde el evento? | cliente | G1 |
| ¿Qué tan tolerante es el negocio a un retraso de segundos en la actualización? | cliente | G1 |

### API / webhooks

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Quién consume esta API — terceros externos, apps propias, ambos? Cambia el nivel de contrato exigido. | cliente | G1 |
| ¿Qué pasa si el receptor de un webhook no responde o responde con error — se reintenta? (*) | cliente | G1 |
| ¿Hay versión de la API garantizada, o se puede romper compatibilidad libremente? | cliente | G1 |

### Offline

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué operaciones deben funcionar sin conexión, y cuáles pueden esperar? | cliente | G1 |
| ¿Qué pasa si dos ediciones offline del mismo registro chocan al reconectar — quién gana? (*) | cliente | G1 |
| ¿Cuánto tiempo puede un usuario estar offline antes de que sus datos locales se consideren obsoletos? | cliente | G1 |

### Multi-tenant

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Los datos de un inquilino pueden cruzarse alguna vez con los de otro, aunque sea para soporte? (*) | cliente | G0 |
| ¿Cómo se factura o se mide el uso por inquilino? | cliente | G1 |
| ¿Qué pasa cuando un inquilino se da de baja — se borran sus datos, se archivan, por cuánto tiempo? (*) | cliente | G1 |

### IA / RAG

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué fuentes alimentan el sistema, y quién es responsable de que estén actualizadas? | cliente | G1 |
| ¿El modelo puede citar su fuente, o responde sin trazabilidad? | cliente | G1 |
| ¿Qué pasa con una consulta que el sistema no puede responder con confianza — escala a un humano? (*) | cliente | G1 |
| ¿Hay costo variable por uso del modelo? ¿Quién lo monitorea y qué pasa si se dispara? (*) | cliente | G1 |

### Administración

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Qué puede configurar el administrador sin depender de un despliegue nuevo? | cliente | G1 |
| ¿Hay más de un nivel de administrador (superadmin vs. admin de cuenta)? | cliente | G1 |
| ¿Qué acción administrativa es tan sensible que requiere confirmación reforzada? | cliente | G1 |

### Soporte

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿Cuál es el canal de soporte, y quién lo atiende — el cliente, Viltrum, un tercero? (*) | cliente | G1 |
| ¿Hay un tiempo de respuesta comprometido (SLA), aunque sea informal? | cliente | G1 |
| ¿El soporte necesita acceso a los datos del usuario para resolver un caso? ¿Con qué rastro? (*) | cliente | G1 |

### Facturación electrónica (e-CF, DGII — República Dominicana)

| Pregunta | a: | bloquea: |
|---|---|---|
| ¿El cliente ya tiene autorización de la DGII para emitir e-CF, o hay que tramitarla? (*) | cliente | G0 |
| ¿Cuál es la clasificación del contribuyente (Grande Nacional, Grande Local, Mediano, Pequeño/Micro) — define el plazo legal de obligatoriedad? (*) | cliente | G0 |
| ¿El cliente tiene certificado digital vigente emitido por una entidad autorizada por INDOTEL? | cliente | G1 |
| ¿Qué tipos de comprobante emite (crédito fiscal, consumo, nota de crédito/débito, gubernamental)? | cliente | G1 |
| ¿Cómo se resuelve un e-CF rechazado por la DGII — reintento automático, corrección manual? (*) | cliente | G1 |
| ¿El sistema debe conservar los comprobantes electrónicamente por los 10 años que exige la norma? (*) | cliente | G0 |

---

## Cómo se usa este banco

1. D00 clasifica tipo de solución y riesgo.
2. D01 identifica los módulos probables por lo que el cliente ya mencionó.
3. D01 copia las preguntas relevantes a `.viltrum/questions.md`, les asigna `Q-nnn` real,
   ajusta `prioridad:` según el riesgo del proyecto, y agrega `dep:` del departamento que
   la necesita.
4. Las preguntas marcadas (*) no se omiten por "parecer obvias" — son las que más caro
   salen cuando se descubren tarde.
