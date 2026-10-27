# Revisión — rama `grok-build`

- Estado: corriendo: modular-continuar (actualizado 2026-10-27T10:16-04:00)
- Hallazgos: 62 — por tipo: funcionalidad 22, mejora 18, diseño 11, móvil 11
- Log completo (no versionado): `/workspace/crm-plan/tablero/revisiones/grok-build.log`

## academy
- [funcionalidad] 0 contenidos reales; permite autocertificarse 100%
- [diseño] Algunos botones con min-h-[36px] violan >=44px
- [móvil] Tabs de cursos sin scroll suave en móvil

## acceso
- [funcionalidad] Falta control de intentos repetidos en login/recuperación
- [mejora] Permisos RBAC no bloquean vistas de ejemplo en producción

## agenda
- [funcionalidad] Viajes y visitas son datos de ejemplo sin backend
- [mejora] 'No asistió' no marca resultado en campo propio
- [móvil] Calendario sin vista de día optimizada para touch

## aprobaciones
- [funcionalidad] Bandeja de descuentos y liquidaciones es preview
- [mejora] Muestra selector 'Estado de demostración' al usuario
- [móvil] Sin bandeja real responsive para aprobaciones

## automatizaciones
- [funcionalidad] Motor de reglas no existe, solo borradores en memoria
- [mejora] Falta regla persistida lead sin actividad → tarea

## brokers
- [funcionalidad] Alcance, protección y onboarding solo vistas previas
- [mejora] Falta onboarding documental y ranking real de red
- [móvil] Tablas de red sin columnas colapsables en móvil

## comisiones
- [funcionalidad] Liquidaciones y reglas usan datos de ejemplo
- [mejora] Se ignora Idempotency-Key y falta aprobación doble
- [diseño] Vistas de liquidación no aplican tokens Private Desk

## comunicaciones
- [funcionalidad] Bandeja y campañas reales no conectadas a YCloud
- [mejora] No se pueden borrar plantillas ni despachar con límite
- [diseño] Pestañas de actividad sin estados Viltrum navy/gold

## comunidad
- [funcionalidad] Demanda, eventos y moderación son solo ejemplos
- [diseño] Navegación de red sin tokens Viltrum consistentes

## configuracion
- [funcionalidad] Rol Manager ausente y escalada de permisos posible
- [mejora] Sección avanzada y catálogos usan datos de ejemplo
- [diseño] Matriz de permisos no usa tokens navy/oro completos
- [móvil] Tablas de permisos con overflow sin sticky headers

## contactos
- [funcionalidad] Consentimiento Ley 172-13 no se guarda en creación
- [mejora] Faltan empresas y relaciones reales en el directorio
- [móvil] Timeline unificado no colapsa en vista móvil

## documentos
- [funcionalidad] Todo es previa; sin Storage privado ni firma real
- [mejora] KYC y expedientes no persisten ni auditan

## inicio
- [funcionalidad] Falta filtro por periodo y broker en KPIs
- [diseño] Botón 'Revisar aprobaciones' expone vista de ejemplo
- [móvil] Widgets de 'mi día' sin colapso en pantallas pequeñas

## leads
- [funcionalidad] SLA y asignación usan datos de ejemplo sin persistencia
- [mejora] Nota de voz fuerza crear_igual sin deduplicar
- [diseño] Algunos botones de acción con px-2 sin min-h-44
- [móvil] Ficha lateral no se adapta bien en móvil sin drawer

## metas
- [funcionalidad] Gráfico de tendencia y alertas de ritmo ausentes
- [mejora] Ignora Idempotency-Key en operaciones

## negocios
- [funcionalidad] Propuestas y descuentos solo vistas previas de ejemplo
- [mejora] No permite borrar ni archivar negocios reales
- [diseño] Tarjetas kanban usan tamaños de fuente inconsistentes

## portal
- [funcionalidad] Todo el portal redirige a expedientes de ejemplo
- [mejora] No conectado a quisqueyahome.com ni unidades reales

## posventa
- [funcionalidad] Casos, garantías y entregas solo ejemplos ficticios
- [mejora] Sin SLA ni garantías vinculadas a contratos

## propiedades
- [funcionalidad] Faltan mapa interactivo y disponibilidad en vivo
- [diseño] Ficha PDF y comparador no usan tokens Viltrum oro
- [móvil] Galería de unidades sin swipe horizontal en móvil
- [mejora] Avances usan _ejemplo sin fotos reales publicables

## reportes
- [funcionalidad] Informes programados y constructor son de ejemplo
- [mejora] Falta embudo por fuente y costo por lead real
- [móvil] Tablas de operaciones sin vista móvil dedicada

## reservas
- [funcionalidad] Admin recibe 'Sin permiso' por falta de RLS reservations
- [mejora] Holds, cartera y facturación usan ejemplos sin backend
- [diseño] Botones de acción financiera con tamaños <44px en previews

## tareas
- [funcionalidad] Recurrencias y packs viven solo en memoria
- [diseño] Vista de 3479 líneas sin split de componentes
- [móvil] Algunos inputs de paso con min-h-36px <44px

