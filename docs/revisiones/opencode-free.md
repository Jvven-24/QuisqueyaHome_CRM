# Revisión — rama `opencode-free`

- Estado: corriendo: doc-luna-ui (actualizado 2026-10-27T13:38-04:00)
- Hallazgos: 80 — por tipo: funcionalidad 63, diseño 10, mejora 6, movil 1
- Log completo (no versionado): `/workspace/crm-plan/tablero/revisiones/opencode-free.log`

## academy
- [funcionalidad] Falta cargar contenidos en academy
- [funcionalidad] Falta tutor para validar certificación
- [funcionalidad] Falta bloquear autocertificación al 100

## acceso
- [funcionalidad] Falta límite de intentos en login
- [funcionalidad] Falta MFA para administradores
- [mejora] Falta arreglar recuperación según Host de petición

## agenda
- [funcionalidad] Falta campo propio de resultado de visita
- [funcionalidad] Falta sincronización con Google Calendar
- [funcionalidad] Falta recordatorio de cita por WhatsApp
- [funcionalidad] Falta corregir estado No asistió reabre pendiente

## aprobaciones
- [funcionalidad] Falta bandeja real de descuentos y liquidaciones
- [diseño] Falta quitar selector Estado de demostración
- [funcionalidad] Falta auditoría de decisiones de aprobación

## automatizaciones
- [funcionalidad] Falta motor persistido de automatizaciones
- [funcionalidad] Falta regla lead sin actividad en 24 horas
- [diseño] Falta vista editable distinta de ejemplo

## avances
- [funcionalidad] Falta mostrar cronograma de obra al comprador

## brokers
- [funcionalidad] Falta onboarding real con documentos
- [funcionalidad] Falta protección de cliente por broker
- [funcionalidad] Falta ranking de desempeño por broker
- [diseño] Falta secciones reales en lugar de ejemplo

## comisiones
- [funcionalidad] Faltan liquidaciones reales con aprobación
- [funcionalidad] Falta reglas de comisión versionadas
- [funcionalidad] Falta exportar PDF del pago de comisión
- [funcionalidad] Falta respetar Idempotency-Key

## comunicaciones
- [funcionalidad] Falta bandeja real de WhatsApp e Instagram
- [funcionalidad] Falta borrar plantillas de mensajería
- [funcionalidad] Falta registro de entrega y lectura
- [mejora] Falta límite de longitud al despachar

## comunidad
- [funcionalidad] Falta decidir alcance de módulo comunidad
- [diseño] Falta ocultar comunidad si está fuera de alcance
- [funcionalidad] Falta moderación real de demandas y eventos

## configuracion
- [funcionalidad] Falta evitar escalada de permisos en roles
- [funcionalidad] Falta rol Manager en matriz RBAC
- [funcionalidad] Falta bloquear celdas duplicadas de permisos
- [diseño] Falta sección avanzada con función real

## contactos
- [funcionalidad] Falta guardar consentimiento Ley 172-13
- [funcionalidad] Falta timeline unificado de interacciones
- [funcionalidad] Falta módulo real de empresas y demandas
- [mejora] Falta exportación de contactos con filtros

## documentos
- [funcionalidad] Falta repositorio privado en Supabase Storage
- [funcionalidad] Falta firma electrónica de documentos
- [funcionalidad] Falta KYC real de clientes

## inicio
- [funcionalidad] Faltan KPIs por periodo y broker en inicio
- [diseño] Falta ocultar botón de aprobaciones de ejemplo
- [funcionalidad] Falta widget de mi día con tareas y citas
- [mejora] Faltan datos semilla Demo separados de reales

## leads
- [funcionalidad] Falta editar lead: error brokerId NaN
- [funcionalidad] Falta importación CSV real de leads
- [funcionalidad] Falta deduplicar y fusionar leads
- [funcionalidad] Falta SLA real de tiempo de respuesta
- [diseño] Falta ocultar botón Tomar sin permiso broker

## metas
- [diseño] Falta gráfico de tendencia de metas
- [funcionalidad] Falta alerta de ritmo de cumplimiento
- [funcionalidad] Falta metas por proyecto en dashboard
- [funcionalidad] Falta respetar Idempotency-Key en metas

## negocios
- [funcionalidad] Falta archivar o borrar negocio por API
- [funcionalidad] Falta motivo de pérdida obligatorio
- [funcionalidad] Falta plantilla de propuesta en PDF
- [mejora] Falta previsión por etapa del pipeline

## portal
- [funcionalidad] Falta conectar portal con unidades reales
- [funcionalidad] Falta CTA a WhatsApp con trazabilidad de lead
- [diseño] Falta modo claro u oscuro en portal público

## posventa
- [funcionalidad] Falta gestión de casos con SLA
- [funcionalidad] Falta módulo de garantías por unidad

## propiedades
- [funcionalidad] Falta mapa geográfico de inventario
- [funcionalidad] Falta ficha PDF para compartir con cliente
- [movil] Falta responsive del workspace en tablet
- [funcionalidad] Falta escapar slug en búsqueda con LIKE

## reportes
- [funcionalidad] Falta constructor de reportes real
- [funcionalidad] Faltan reportes programados por correo
- [funcionalidad] Falta embudo por fuente y costo por lead

## reservas
- [funcionalidad] Faltan permisos reservations y holds en base
- [funcionalidad] Falta flujo hold → reserva → plan de pagos
- [funcionalidad] Falta conciliación y facturación reales
- [diseño] Falta quitar sub-vistas de ejemplo del menú

## tareas
- [funcionalidad] Falta transacción en packs de tareas
- [funcionalidad] Falta zona horaria configurable al -04:00 fijo
- [mejora] Falta partir vista.tsx de 3479 líneas
- [funcionalidad] Falta recurrencia real de tareas

