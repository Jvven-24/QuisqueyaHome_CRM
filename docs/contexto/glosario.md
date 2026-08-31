# Glosario — CRM Quisqueya Home

## Roles
| Término | Significado |
|---|---|
| **Administrador (admin)** | Acceso a todos los módulos; único rol con permisos no editables (`column === 0` bloqueado en la matriz de configuración). |
| **Asistente (assistant)** | Ve leads, contactos, agenda, tareas, comunicaciones, avances — no ve pipeline, propiedades, comisiones ni reportes. |
| **Broker** | Agente comercial. Solo ve sus propios leads/negocios/propiedades asignadas (`scope=own`). Tiene nivel y meta mensual. |

## Entidades del dominio (frontend actual → modelo objetivo)
| Término | Significado |
|---|---|
| **Lead** | Hoy: objeto único que mezcla contacto + oportunidad. Objetivo: separado en `contacts` → `leads` → `deals`. |
| **Contacto (contact)** | Persona con la que se interactúa; puede tener varios leads/negocios en el modelo objetivo (hoy es el mismo objeto que Lead). |
| **Negocio (deal)** | Oportunidad comercial en curso por una o más propiedades (`deal_properties`, N:M). |
| **Etapa (stage)** | Posición en el embudo: `Nuevo → Contactado → Presentación → Preselección → Negociación → Cierre`, con `Perdido` como salida lateral desde cualquier etapa. |
| **Próxima acción (next)** | Hoy texto libre en el lead (ej. `"Contactar hoy, 11:30 AM"`); objetivo: referencia a una `activity` con responsable y fecha. |
| **Actividad (activity)** | Tarea, llamada, cita o nota vinculada a un negocio/contacto. Unifica lo que hoy son `tasks` y `Appointment`, estructuras separadas. |

## Inventario
| Término | Significado |
|---|---|
| **Proyecto (project)** | Desarrollo inmobiliario (ej. "Praderas de Punta Cana"). Tiene precio interno (`price`, solo admin) y rango público (`public`). |
| **Unidad (unit)** | Vivienda/lote individual dentro de un proyecto; estados `Disponible`, `Reservada`, `Vendida`. |
| **Fase de obra (construction_phase)** | Etapa de construcción de un proyecto (8 fijas hoy: Movimiento de tierra … Entrega; objetivo: parametrizable por proyecto). |
| **Precio real vs. rango público** | El precio real de unidad/proyecto solo lo ve `admin`; el resto ve un rango publicable — única restricción a nivel de campo que existe hoy en el frontend. |

## Desempeño
| Término | Significado |
|---|---|
| **Nivel de broker** | Escala `Junior → Senior → Senior+ → Top Producer → Top Leader`, según ventas acumuladas del año. |
| **Meta (goal)** | Objetivo mensual de negocios cerrados por broker o global. Meta mensual de referencia observada: 10 negocios. |
| **Comisión (commission)** | Generada al cerrar un negocio; estados `Pendiente → Aprobada → Pagada`; reparto interno (ej. `50% broker / 50% agencia`). |

## Siglas y términos internos
| Término | Significado |
|---|---|
| **CRM** | El sistema descrito en este repo (`Quisqueya Home CRM`). |
| **RBAC** | Role-Based Access Control — control de acceso por rol/recurso/acción/alcance (ver `permissions` en el esquema). |
| **SLA** | Tiempo límite para primer contacto/respuesta a un lead antes de disparar alerta o reasignación. |
| **`scope=own`** | Alcance de permiso: el usuario solo ve/edita lo que le pertenece (reemplaza comparación de strings del frontend actual). |
| **`kind` (de una etapa)** | Naturaleza de la etapa (`open`/`won`/`lost`) — lo que enganchan las reglas de negocio, no el nombre visible. |
| **D1** | Cloudflare D1, la base de datos SQL usada (binding aún no configurado, `null` en `.openai/hosting.json`). |
| **vinext** | Framework/runtime (`cloudflare/vinext`) sobre el que corre este starter de Next.js en Cloudflare Workers. |
| **SIWC** | Sign In With ChatGPT — mecanismo de autenticación opcional documentado en `README.md` y `app/chatgpt-auth.ts`, no usado por el login actual del CRM (que es simulado). |
| **T1…T10** | Identificadores de "capas transversales" (fundación de datos, auth, RBAC, rutas, etc.) definidos en `MAPEO_FRONTEND_CRM.md` §11. |
| **M1…M15** | Identificadores de módulo (Contactos, Leads, Pipeline, …) definidos en `MAPEO_FRONTEND_CRM.md` §12, cada uno con tablas y carpeta de ruta propia (§18). |
| **F0…F5** | Fases de construcción sugeridas para el cronograma (`MAPEO_FRONTEND_CRM.md` §19.1). |

## Módulos del sidebar (15, numerados 00–14)
Inicio · Leads · Contactos · Pipeline · Citas y agenda · Propiedades internas · Brokers · Academy · Metas y desempeño · Comisiones · Tareas y actividades · Comunicaciones · Reportes y BI · Avances de obra · Configuración y permisos.

[PENDIENTE: glosario de negocio inmobiliario específico del mercado dominicano (ej. términos legales o de titulación) — no aparece en el código ni en los documentos revisados].
