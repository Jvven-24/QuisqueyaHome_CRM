# Capacidades esperadas por tipo de solución

> Resumen ejecutivo: cada tipo de solución del mercado lleva ciertas capacidades de
> fábrica, aunque el cliente no las pida explícitamente. Esta referencia responde "qué
> debe llevar sí o sí" antes de que el cliente lo eche de menos en producción. D01 la
> incorpora al PRD como línea base; D02 decide si alguna queda excluida de esta fase, y
> entonces se escribe como exclusión explícita, no como olvido.

No es una lista de deseos. Es lo que un producto comparable del mercado ya trae, y cuya
ausencia se nota de inmediato.

---

## E-commerce

| Capacidad | Por qué es línea base |
|---|---|
| Carrito persistente entre sesiones | El abandono de carrito es la métrica más vigilada del rubro |
| Gestión de inventario con reserva al añadir al carrito | Evita vender lo que no hay |
| Cálculo de impuestos y envío antes del pago final | El cliente no acepta sorpresas en el último paso |
| Historial de pedidos y estado de envío consultable por el comprador | Reduce carga de soporte |
| Cupones y descuentos administrables sin despliegue | Es palanca comercial de uso frecuente |
| Búsqueda con filtros por atributo (precio, categoría, disponibilidad) | Estándar desde hace más de una década |
| Reseñas o valoraciones, si el rubro lo espera | Afecta conversión directamente |
| Panel de administración para gestión de catálogo y pedidos | El negocio no opera desde la base de datos |

## SaaS

| Capacidad | Por qué es línea base |
|---|---|
| Múltiples planes con límites diferenciados | El modelo de negocio depende de eso |
| Panel de facturación propio para el cliente (ver plan, historial, actualizar método de pago) | Reduce soporte y da autonomía |
| Invitación y gestión de usuarios dentro de una cuenta | Ningún SaaS serio se usa con una sola cuenta compartida |
| Bitácora de auditoría de acciones administrativas | Exigencia mínima de confianza empresarial |
| API o exportación de datos propios del cliente | Sin esto, el cliente queda cautivo — riesgo comercial y de confianza |
| Aislamiento verificable entre cuentas (multi-tenant) | Es la promesa base del modelo |
| Estado del servicio visible (uptime, incidentes) | Estándar de transparencia esperado |

## CRM / ERP

| Capacidad | Por qué es línea base |
|---|---|
| Auditoría de cambios por registro (quién, cuándo, qué cambió) | Es lo primero que se pregunta en una disputa interna |
| Roles y permisos granulares, no binarios | La operación real nunca es "todos ven todo" |
| Importación y exportación masiva | La migración de datos y los reportes externos son constantes |
| Búsqueda global rápida | El tiempo de un vendedor o analista se pierde buscando |
| Papelera / borrado lógico con recuperación | Un borrado accidental sin papelera es un incidente, no un error menor |
| Historial de interacciones por cliente/proveedor | Es el núcleo de valor de cualquier CRM |
| Reportes básicos exportables (no solo pantallas) | El negocio los necesita fuera del sistema, en reuniones y juntas |

## Portal / CMS

| Capacidad | Por qué es línea base |
|---|---|
| Editor de contenido sin depender de un desarrollador | Es la razón de ser de un CMS |
| Vista previa antes de publicar | Evita errores públicos |
| Programación de publicación futura | Uso constante en portales de noticias y eventos |
| Control de versiones de contenido | Permite revertir un error editorial |
| SEO básico administrable por página (título, descripción, imagen) | Estándar de cualquier sitio público |
| Roles de editor vs. publicador si hay flujo de aprobación | Evita publicaciones no revisadas |

## Marketplace

| Capacidad | Por qué es línea base |
|---|---|
| Perfil y reputación del vendedor visible al comprador | Sostiene la confianza del modelo |
| Panel de vendedor independiente del panel de administración | El vendedor no debe operar desde el backoffice de la plataforma |
| Resolución de disputas con evidencia adjunta | Es inevitable que ocurran, y sin proceso escalan a soporte manual |
| Liquidación y reporte de comisiones al vendedor | Es la base del modelo de ingresos |
| Búsqueda y filtros multi-vendedor | El comprador compara antes de decidir |

## App móvil

| Capacidad | Por qué es línea base |
|---|---|
| Estados de carga, error y vacío nativos, no solo en la versión web | La app se usa con conexión inestable por defecto |
| Notificaciones push administrables por el usuario | Estándar de retención |
| Actualización forzada u opcional cuando hay versión crítica | Evita soporte a versiones rotas indefinidamente |
| Manejo explícito de permisos del dispositivo (cámara, ubicación, notificaciones) | Exigencia de las tiendas y de UX |
| Cierre de sesión remoto o revocación de dispositivo | Requisito de seguridad mínimo |

## Plataforma con pagos

| Capacidad | Por qué es línea base |
|---|---|
| Recibo o comprobante descargable de cada transacción | Exigencia legal y de confianza en casi todos los mercados |
| Conciliación entre lo cobrado y lo liquidado | Sin esto, la contabilidad se hace a mano y con errores |
| Manejo explícito de pagos fallidos y reintentos | Es la causa más común de pérdida de ingresos recurrentes |
| Nunca almacenar datos completos de tarjeta | Requisito no negociable de PCI-DSS |
| Historial de transacciones consultable por el usuario | Reduce disputas y soporte |

## Sistema interno

| Capacidad | Por qué es línea base |
|---|---|
| Roles alineados a los puestos reales del organigrama, no genéricos | Evita accesos excesivos por comodidad |
| Reportes que alimentan las decisiones que ya se tomaban antes con el sistema anterior | Si el sistema nuevo no los da, el negocio vuelve a Excel |
| Migración de datos históricos verificable | Sin verificación, se descubre el error meses después |
| Bitácora de quién hizo qué, al menos en las acciones críticas | Base mínima de confianza operativa |

## Dashboard / Analytics

| Capacidad | Por qué es línea base |
|---|---|
| Filtro por rango de fechas | Es la primera pregunta de cualquier usuario de un dashboard |
| Exportación de lo que se está viendo | Se usa en reportes y presentaciones fuera del sistema |
| Indicación de cuándo se actualizaron los datos por última vez | Sin esto, un dato desactualizado se confunde con uno vigente |
| Permisos diferenciados por rol sobre qué métricas ve cada quien | No toda la organización debe ver todos los números |

## Solución IA / RAG

| Capacidad | Por qué es línea base |
|---|---|
| Indicación de cuándo el sistema no está seguro de la respuesta | Evita que una alucinación se confunda con un hecho |
| Registro de las conversaciones o consultas para auditoría y mejora | Sin esto no hay forma de detectar patrones de falla |
| Límite y monitoreo de costo por uso | El costo variable de un modelo puede dispararse sin aviso |
| Vía de escalamiento a un humano | Ningún sistema de IA de producción se lanza sin salida a humano |

## Facturación electrónica (República Dominicana — e-CF DGII)

| Capacidad | Por qué es línea base |
|---|---|
| Generación de comprobantes en el formato XML vigente de la DGII | Es requisito legal, no una preferencia técnica |
| Firma digital con certificado válido antes del envío | Sin firma válida el comprobante no tiene valor fiscal |
| Manejo de aprobación, rechazo y contingencia ante caída del servicio de la DGII | Es el escenario que todo sistema real enfrenta tarde o temprano |
| Conservación electrónica de comprobantes por el plazo legal | Exigido para auditorías fiscales |
| Numeración de secuencia controlada y sin huecos no explicados | Es un punto de revisión fiscal habitual |

---

## Regla de uso

1. D01 revisa la sección del tipo de solución clasificado antes de cerrar el PRD.
2. Cada capacidad de la tabla entra al PRD como línea base, salvo que D02 la excluya
   explícitamente con razón escrita.
3. Esta referencia se actualiza cuando un proyecto real revela una capacidad esperada que
   no estaba aquí — se agrega y se registra en `MEMORY.md`.
