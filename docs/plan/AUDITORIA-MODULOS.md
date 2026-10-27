# Auditoría funcional por módulo: CRM Quisqueya Home
27/10/2026, 12:05 AM hora RD. Solo lectura: no se cambió código ni se desplegó nada.

**Base:**
- La auditoría parte de `PLAN-EQUIPO.md` y `audit.json`: las 58 pantallas cargan con estado 200.
- Se crearon registros [Prueba] por API con la cuenta admin.prueba (scripts `crud*.py`).
- Se inspeccionó el código en /opt/qh-dev/app.
- Claude Code CLI hizo una revisión independiente (`claude-review.md`). Sus hallazgos llevan la marca **[Claude]**.

**Leyenda:**
- Vista: L = lista, D = detalle, C = crear, E = editar. ✔ existe y es real; ◐ es una vista previa con datos de ejemplo; ✘ no existe.
- Funciona: ✔ probado de punta a punta con datos reales; ◐ funciona solo en parte; ✘ es de ejemplo o está bloqueado.

## Registros [Prueba] creados (para limpiar)
| Entidad | ID | Qué se le hizo |
|---|---|---|
| Contacto | 1000452 | Creado, editado y exportado |
| Lead | 1000642 (crea el contacto 1000453) | Creado y convertido en negocio |
| Negocio | 1000176 | Creado al convertir el lead; sigue en la etapa 8 "Nuevo" |
| Tarea | 1001812 | Creada y completada |
| Proyecto | 1000021 (slug `prueba-proyecto-auditoria`) | Creado y editado |
| Unidad | 1000400 | Creada |

## Resultado de las pruebas de escritura
| Flujo | Resultado |
|---|---|
| Contacto: crear, editar, exportar | ✔ |
| Lead: crear | ✔ |
| Lead: convertir en negocio | ✔ |
| Búsqueda global | ✔ Encuentra los registros [Prueba] |
| Lead: editar (PATCH) | ✘ **400 `brokerId: expected number, received NaN`** cuando no se envía el broker. Es un bug de validación |
| Lead: "Tomar" | Devuelve 403 al admin, porque solo los brokers pueden tomar leads. Es correcto, pero la UI debería ocultar el botón |
| Negocio: pasar a "Contactado" | Devuelve 409 si no hay una actividad de contacto. La regla es correcta |
| Tarea: crear y completar | ✔ Completarla exige describir la evidencia |
| Proyecto y unidad: crear y editar | ✔ |
| Calendario .ics | ✔ |
| Exportar comisiones a CSV | ✔ |
| **Reservas / Holds (GET)** | ✘ **403 incluso para el Administrador.** La tabla `permissions` no tiene ninguna fila de `reservations` ni de `holds`. En la base hay 0 reservas y 0 holds, así que el módulo entero está inutilizable |
| Academy | El API responde, pero hay 0 contenidos cargados |
| Notificaciones | ✔ Funciona, aunque la bandeja está vacía |

En la base hay 650 leads, 460 contactos, 184 negocios, 25 proyectos, 404 unidades, 1813 actividades, 264 metas y 17 comisiones. En pantalla, muchos registros siguen con el prefijo "Demo …", es decir, son datos semilla mezclados con los reales.

## Tabla por módulo
| Módulo / sub-vista | Vista L/D/C/E | Funciona | Falta | Mejoras | Sev. |
|---|---|---|---|---|---|
| **Inicio** | L✔ | ✔ | KPIs sin filtro por periodo ni por broker | El botón "Revisar aprobaciones" lleva a una vista de ejemplo [Claude] → ocultarlo; widgets de "mi día" | Media |
| **Leads** | L✔ D✔ C✔ E◐ | ◐ | Editar falla con brokerId=NaN. Duplicados e importaciones son de ejemplo. El SLA es solo una vista previa | La nota de voz fuerza `crear_igual` (salta la deduplicación), pone el presupuesto mínimo igual al máximo y no avisa si falla la tarea [Claude]. Hace falta importar CSV real, deduplicar y fusionar, asignar por turnos y medir el SLA | **Alta** |
| Leads/asignación | L◐ | ◐ | Reglas persistidas | Asignar por turnos, zona o idioma | Media |
| **Negocios** | L✔ D✔ C✔(desde lead) E✔ | ✔ | No se puede borrar ni archivar un negocio por API. Propuestas, descuentos y reapertura son de ejemplo [Claude] | Plantillas de propuesta en PDF; motivos de pérdida obligatorios; previsión por etapa | Media |
| **Contactos** | L✔ D✔ C✔ E✔ | ✔ | Empresas, demandas, relaciones y privacidad son de ejemplo. El consentimiento no se guarda, lo que es un riesgo legal [Claude] | Guardar el consentimiento (Ley 172-13), cuentas o empresas reales y un timeline unificado | **Alta** |
| **Inventario / Propiedades** | L✔ D✔ C✔ E✔ | ✔ | Partes del workspace y del dossier son de ejemplo. El slug usa `LIKE` sin escapar [Claude] | Mapa, filtros por estado de unidad, ficha PDF para el cliente y la disponibilidad en vivo en el portal | Media |
| Avances (fases y fotos) | L✔ C✔ E✔ | ◐ | El timeline usa `_ejemplo` | Mostrar al comprador | Baja |
| **Agenda** | L✔ C✔ E✔ | ◐ | Calendario ✔; viajes y visitas son de ejemplo. "No asistió" vuelve a quedar pendiente y el resultado se guarda dentro de la descripción [Claude] | Campos de resultado de la visita, sincronización con Google Calendar y recordatorios por WhatsApp | Media |
| **Tareas** | L✔ C✔ E✔ | ✔ | Recurrencias es de ejemplo. Los packs de tareas no usan transacción, así que al reintentar se duplican, y la zona -04:00 está fija en el código [Claude] | Partir `vista.tsx` (3.479 líneas) y hacer las recurrencias reales | Media |
| **Comunicaciones** | Plantillas L✔ C✔ E✔ | ◐ | Bandeja y campañas son de ejemplo. No se pueden borrar plantillas. `despachar` no limita la longitud [Claude] | Bandeja real de WhatsApp e IG (YCloud ya existe), campañas segmentadas y registro de entrega y lectura | **Alta** |
| **Brokers** | L✔ D✔ E◐ | ◐ | Alcance, cooperación, protección, onboarding, salida y mi-espacio son la misma vista de ejemplo [Claude] | Onboarding real con documentos, protección de cliente por broker y ranking | Media |
| **Comisiones** | L✔ E✔ | ◐ | Liquidaciones y reglas son de ejemplo. `/comisiones/liquidaciones/ejemplo` sirve datos falsos. Se ignora el `Idempotency-Key` [Claude] | Reglas versionadas, liquidaciones con aprobación y exportar el PDF del pago | **Alta** |
| **Metas** | L✔ C✔ E✔ Borrar✔ | ✔ | Se ignora el `Idempotency-Key`. Editar exige `goals:edit` y no el rol admin. El DELETE lleva el cuerpo en JSON [Claude] | Gráfico de tendencia, alertas de ritmo y metas por proyecto en el dashboard | Baja |
| **Reportes** | L✔ | ✔ | Los programados y el constructor son de ejemplo [Claude] | Informes programados por correo, embudo por fuente y costo por lead | Media |
| **Reservas** (+holds, cartera, conciliación, excepciones, facturación, documentos, plan) | L◐ D◐ C◐ | ✘ | **Al admin no le carga ("Sin permiso") porque faltan los permisos `reservations` y `holds` en la base.** Toda la parte financiera es de ejemplo | Sembrar los permisos; sacar del menú las vistas de ejemplo; flujo hold → reserva → plan de pagos → recibo | **Crítica** |
| **Portal** | ◐ | ✘ | Todo es de ejemplo y lo protege `settings:view` [Claude] | Conectarlo al sitio quisqueyahome.com y publicar las unidades | Media |
| **Comunidad** | ◐ | ✘ | Todo es de ejemplo | Decidir si entra en el alcance; si no, ocultarla | Baja |
| **Aprobaciones** | ◐ | ✘ | Todo es de ejemplo y muestra un selector "Estado de demostración" al usuario [Claude] | Bandeja real de descuentos y liquidaciones con auditoría | **Alta** |
| **Automatizaciones** | ◐ | ✘ | No hay motor y los borradores solo viven en memoria [Claude] | Reglas persistidas (lead sin actividad en 24 h → tarea o WhatsApp) | Media |
| **Academy** | L✔ C✔ E✔ | ◐ | 0 contenidos. Cualquier usuario con permiso de ver puede autocertificarse al 100 % [Claude] | Cargar cursos y exigir la revisión de un tutor | Media |
| **Documentos** (+firmas, KYC) | ◐ | ✘ | Todo es de ejemplo, aunque Tareas promete un enlace seguro para la Ley 155-17 [Claude] | Repositorio privado (Supabase Storage), firma electrónica y KYC | **Alta** |
| **Posventa** | ◐ | ✘ | Todo es de ejemplo | Casos con SLA y garantías | Baja |
| **Configuración** | L✔ E✔ | ◐ | **Escalada: un rol con `settings:edit` puede ampliar sus propios permisos.** Acepta celdas duplicadas [Claude]. La sección avanzada es de ejemplo. No existe el rol Manager | Matriz RBAC por broker y rol Manager (ver PLAN-EQUIPO §4) | **Alta** |

## Código: rutas sin UI y UI sin backend
**Sin UI:**
- `POST /api/leads/externo`: es correcto, porque es un webhook. Pero no tiene límite de peticiones ni de longitud [Claude].
- `POST /api/auth/demo`: conviene revisar si debe existir en producción.
- `/api/pipeline/[id]/propiedades` solo se usa de forma indirecta.

**Sin backend:**
- Todas las vistas `◐` (unas 30 sub-vistas) usan `datos-muestra.ts`, `_ejemplo.ts` o `*-previa.tsx`.
- Las APIs de Reservas y Holds sí existen, pero el RBAC las bloquea para todos.

**Transversal [Claude]:**
- El login no frena intentos repetidos.
- `audio-transcribe` acepta hasta 14 MB sin límite de uso del servicio de IA.
- La búsqueda no escapa `%` ni `_`.
- El enlace de recuperación de contraseña depende del Host de la petición.

## Top 15 priorizado
1. **[Crítica]** Sembrar los permisos `reservations` y `holds` (admin y asistente con `all`, broker con `own`) y probar hold → reserva de punta a punta.
2. **[Alta]** Cerrar la escalada del editor de roles: nadie edita su propio rol y nadie concede más de lo que tiene [Claude].
3. **[Alta]** Arreglar el error brokerId=NaN al editar un lead (`CrearLeadInput`/PATCH).
4. **[Alta]** Ocultar o marcar como "Próximamente" las ~30 vistas de ejemplo en producción, sobre todo las financieras, KYC y aprobaciones, y quitar el enlace desde Inicio.
5. **[Alta]** Guardar de verdad el consentimiento y la privacidad del contacto.
6. **[Alta]** Bandeja real de WhatsApp e IG conectada a YCloud (ya existe el relay).
7. **[Alta]** Liquidaciones y reglas de comisión reales, con aprobación.
8. **[Alta]** Documentos y KYC en almacenamiento privado.
9. **[Alta]** Rol Manager y matriz por broker (PLAN-EQUIPO §4).
10. **[Media]** Limitar intentos y tamaño en login, recuperación, `leads/externo` y `audio-transcribe` [Claude].
11. **[Media]** Respetar `Idempotency-Key` en comisiones y metas; usar transacciones en los packs de tareas y la nota de voz [Claude].
12. **[Media]** La nota de voz no debe forzar `crear_igual`; deduplicación e importación CSV reales.
13. **[Media]** Resultado de visita en campos propios y corregir "No asistió" [Claude].
14. **[Media]** Separar o limpiar los datos semilla "Demo …" de los reales antes de presentar.
15. **[Media]** Academy: cargar contenido y bloquear la autocertificación; suite E2E de flujos con escritura (backlog #3).
