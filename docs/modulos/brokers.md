# Brokers

## Propósito
Gestión de la red de brokers (asesores externos o internos): tablero con cumplimiento de meta y cartera de cada broker, ficha individual, asignación de proyectos, vista "ver como broker" para soporte, y toma de leads. Onboarding, cooperación, protección de cliente y salida son vistas previas de ejemplo.

Buenas prácticas de industria (red de brokers en RD y preventa):
- Protección de cliente o registro: un cliente queda asociado a un broker con plazo de vigencia, renovable y auditado. Sin plazo, el broker pierde el incentivo a cerrar.
- Reglas de reparto de leads transparentes (por turno, zona, idioma o proyecto) y medidas en tiempo de respuesta.
- Onboarding con documentos verificados y ruta de capacitación (Academy). Documentos según lo que exija el cliente; confirmar requisitos antes de construir.
- Salida ordenada: traspaso de cartera, reasignación de leads abiertos y conservación del historial; nunca borrar negocios.
- Precios internos y de costo nunca visibles para el broker (`unit_real_price`).
- Cooperación entre brokers con reparto de comisión acordado por escrito. El compendio la deja fuera del alcance inicial.

## Roles y permisos
Recurso RBAC: `brokers` (view). Asignar proyectos usa `projects` (edit) con alcance `all`.

| Rol (slug) | Acciones | Alcance | Efecto |
|---|---|---|---|
| Administrador (`admin`) | brokers view; projects edit | all | Tablero completo, asigna proyectos, ver como broker |
| Asistente (`assistant`) | brokers view; projects edit | all | Tablero completo y asigna proyectos |
| Gerente (`manager`) | brokers view | team | Su equipo; ver como broker (el código solo admite admin y gerente) |
| Broker (`broker`) | brokers view | own | Solo su ficha; `/brokers/mi-espacio` redirige a ella |

- Asignar proyectos: solo alcance `all`. Un gerente con `projects:edit` en team no basta.
- `ver-como`: exige `brokers:view` y rol admin o gerente; la sesión queda marcada como vista en nombre del broker (`viewingAs`).
- Tomar lead (`/api/leads/[id]/tomar`): solo broker. Admin recibe 403 por diseño; la UI debe ocultar el botón.

## Flujos principales
1. Ver el tablero: una tarjeta por broker con cumplimiento de meta del mes, cierres, proyectos y cartera. Se calcula con tres consultas agregadas, sin una consulta por tarjeta.
2. Abrir la ficha `/brokers/[id]` (cartera, metas y proyectos asignados).
3. Asignar proyectos a un broker (`/api/brokers/[id]/proyectos`): se muestra el diff (qué se asigna y qué se suelta), se aplica en transacción y se audita cada proyecto que cambió.
4. Ver como broker (admin o gerente): la pantalla muestra lo que ve ese broker, sin acciones en su nombre.
5. Tomar un lead asignado a la red (solo broker): candidatos en `leads/_broker-candidatos`.
6. Onboarding con documentos y capacitación: vista previa de ejemplo.
7. Cooperación, protección, alcance y salida: la misma vista de ejemplo en todas las rutas.
8. Mi espacio: redirige a la ficha propia del broker.

## Datos
- `users` con `role_id` → `roles.slug` (admin, assistant, broker, manager).
- `broker_profiles`: `user_id`, `specialty`, `agency_id`, `handles_rentals`, `level` (junior por defecto), `annual_sales_cents`, `monthly_target_deals`.
- `agencies`, `teams`, `team_members`, `manager_scopes` (gerente ↔ equipos), `user_permission_overrides` (excepciones por usuario, con motivo).
- Propiedad de la cartera: `projects.broker_id`, `units.broker_id`, `contacts.broker_id`, `leads` (asignación).
- Metas para el tablero: `goals` (ver Metas).
- **Faltan:** documentos de onboarding; registro de protección con vigencia; historial de cooperación; eventos de salida y traspaso.

## Estados de UI
| Estado | Situación en código | Qué debe mostrar |
|---|---|---|
| Vacío | Sí: "Sin proyectos activos" en `brokers/vista.tsx` | Mensaje y acción si el actor puede asignar |
| Cargando | Falta: no hay `loading.tsx` en `brokers` | Esqueleto de tarjetas |
| Error | Sí: `error.tsx` y `error-compartido.tsx` | Aviso con reintento |
| Sin permiso | Sí: `requireScopeInPage(brokers, view)` | Aviso de permiso; el broker ve solo su ficha |
| Éxito | No verificado | "Proyectos asignados" con el número de cambios |
| Parcial | No aplica: la asignación es transaccional | Error y sin cambios |

## Estado actual vs PRD
Fuentes: código en `/tmp/qh-review` y `AUDITORIA-MODULOS.md` (27/10/2026, Brokers: severidad Media).

- **Existe y funciona:** tablero y ficha con agregados; asignación de proyectos con diff y auditoría; ver como broker; toma de lead; mi espacio.
- **Es demo:** alcance, cooperación, protección, onboarding y salida (misma vista de ejemplo).
- **Falta:** onboarding real con documentos; protección con vigencia; cooperación; salida con traspaso; ranking real.
- **PRD (compendio):** "broker hub básico" está en el alcance inicial. El apartado para brokers pide capacitación y recursos organizados. "Usuarios, brokers y favoritos" aparece en el roadmap. La colaboración inmobiliaria completa queda fuera del alcance inicial.

## Checklist de aceptación
- [x] Tablero con cumplimiento de meta por broker
- [x] Asignar proyectos con diff auditado
- [x] Asignar proyectos solo con alcance total
- [x] Ver como broker para admin y gerente
- [x] Mi espacio redirige a la ficha propia
- [ ] Onboarding con documentos reales
- [ ] Protección de cliente con vigencia
- [ ] Cooperación entre brokers con reparto acordado
- [ ] Salida con traspaso de cartera y leads
- [ ] Broker hub con capacitación y recursos

## Dependencias
- **Metas y Comisiones:** cumplimiento del tablero y comisión por cierre.
- **Leads, contactos, negocios, proyectos y unidades:** propiedad de la cartera.
- **Academy:** capacitación de onboarding y broker hub.
- **Documentos:** documentos de onboarding (pendiente; sin repositorio privado).
- **Configuración y RBAC:** roles, `manager_scopes`, `user_permission_overrides`.
- **Inventario:** `unit_real_price` oculto al broker.
