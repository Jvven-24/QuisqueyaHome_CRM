# PXIL — Product Experience Intelligence Layer

> Extracted from PDF: PXIL.pdf

> Pages: 31

---


## Page 1

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  1



## Page 2

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  2
Resumen ejecutivo
Este documento aterriza una capa especializada para agentes de IA capaz de pasar de una idea de producto a una 
especificacion completa de software y, despues, a una interfaz implementable y verificable. La propuesta evita el error 
comun de empezar por componentes visuales: primero crea el contrato del producto y del comportamiento; despues 
decide la composicion visual; finalmente implementa y valida.
Nombre de trabajo: PXIL.  Product & Experience Intelligence Layer. Su funcion no es "dibujar pantallas" sino 
convertir alcance, dominio, reglas y calidad en un grafo trazable de requisitos, modulos, datos, permisos, flujos, 
pantallas, estados, eventos, componentes, APIs y pruebas.
La investigacion se apoya en ingenieria de requisitos (ISO/IEC/IEEE 29148), descripcion de arquitectura (ISO/IEC/IEEE 
42010), calidad de producto (ISO/IEC 25010), calidad en uso (ISO/IEC 25019), calidad de datos (ISO/IEC 25012), diseno 
centrado en humanos e interaccion (ISO 9241-210, 9241-110 y 9241-112), WCAG 2.2 y WAI-ARIA, heuristicas de 
Nielsen, NIST/OWASP para seguridad y privacidad, OpenAPI/RFC 9457 para contratos, OpenTelemetry para 
observabilidad, SCXML/BPMN para estados y procesos, y las capacidades actuales de 21st.dev y Google Antigravity. 
[S11-S36]
Hallazgo que modifica la idea original.  No se recomienda ni se especifica un scraper masivo de 21st.dev. Sus 
Terms of Service de julio de 2026 prohiben scraping/coleccion automatizada del Marketplace y usar contenido o 
datos del Marketplace para entrenar IA sin consentimiento escrito. La capa debe usar MCP/CLI y flujos oficiales; la 
memoria privada debe construirse con componentes legitimamente instalados y con documentacion/screenshot 
propios generados localmente. [S01]
Que debe producir esta capa
• Un Product Brief verificable con objetivos, usuarios, limites, riesgos y metricas.
• Un mapa del dominio: conceptos, reglas de negocio, entidades, relaciones, estados y procesos.
• Un inventario completo de modulos y capacidades, clasificado por alcance y prioridad.
• Un inventario de pantallas y superficies, incluyendo estados vacios, loading, error, sin permiso, offline, conflicto, 
exito, fallos parciales y responsive.
• Un contrato de interaccion: cada accion del usuario, precondicion, efecto, transicion de estado, feedback, 
notificacion, auditoria y rollback cuando corresponda.
• Un modelo de roles y permisos con minimo privilegio y autorizacion verificable.
• Un modelo de datos con integridad, normalizacion razonable, constraints, historial y politicas de retencion.
• Un sistema de diseno y una direccion visual coherente; no una coleccion de componentes bonitos aislados.
• Un plan de composicion que use 21st-first por medios oficiales y una biblioteca privada de patrones aprobados.
• Criterios de aceptacion y una estrategia de QA funcional, visual, accesible, segura y observable.
Decisiones de arquitectura
Decision
Resultado
21st es fuente, no cerebro
El MCP/CLI recupera candidatos y codigo; PXIL conserva el 
juicio de producto, UX, composicion y QA.
Specification-first
Ningun agente de implementacion empieza hasta cerrar alcance 
minimo, flujos, pantallas, estados y reglas criticas.
Visual verification obligatoria
Compilar no prueba calidad visual. Cada pantalla importante



## Page 3

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  3
debe renderizarse e inspeccionarse en breakpoints definidos.
Memoria privada, no mirror
Se almacenan componentes adoptados, derivados propios, 
tokens, recetas, compatibilidades y resultados de QA; no 
previews/metadata scrapeados de 21st.
Trazabilidad por ID
REQ -> MOD -> FLOW -> SCR -> STA -> EVT -> API/DATA/PERM 
-> TST. Ningun artefacto critico queda huerfano.
Skills > prompt monolitico
Antigravity recomienda skills con carga progresiva; workflows 
estan en retirada para noviembre de 2026. [S10]
Indice de contenido
#
Seccion
1
Problema, objetivo y principios de la capa
2
Fundamentos investigados y estandares
3
Arquitectura operativa de PXIL
4
Intake, discovery y cierre de alcance
5
Ingenieria de requisitos y grafo de trazabilidad
6
Modelado de dominio, modulos y reglas
7
Datos, normalizacion e integridad
8
Roles, permisos, seguridad, privacidad y auditoria
9
Arquitectura UX e informacion
10
Pantallas, estados, eventos y microinteracciones
11
Sistema visual y design system
12
21st.dev: recuperacion, inspeccion y biblioteca privada
13
Antigravity: plugin, skills, agentes y reglas
14
Composicion, implementacion y quality gates
15
Pruebas, accesibilidad, rendimiento y observabilidad
16
Ejemplo: sistema financiero
17
Contratos machine-readable y schemas
18
Definition of Done y checklists
19
Roadmap de implementacion
20
Curriculum y herramientas recomendadas
21
Master Agent Contract
A
Fuentes y referencias



## Page 4

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  4
1. Problema, objetivo y principios de la capa
1.1 El problema real no es la falta de componentes
El problema de calidad aparece cuando un agente salta directamente de una frase como "haz un CRM premium" a 
codigo. En ese salto quedan implicitas preguntas de producto, dominio, roles, datos, estados y riesgos. El resultado 
puede verse atractivo en una captura, pero normalmente contiene huecos: permisos incompletos, formularios sin 
validacion, acciones sin feedback, tablas sin estados vacios, flujos sin recuperacion, configuraciones olvidadas o 
pantallas desconectadas del modelo de negocio.
21st.dev mejora una parte concreta: evita que el agente tenga que inventar todos los componentes. Su propia 
documentacion explica que un catalogo ayuda a recuperar UI real, pero que el agente aun puede equivocarse en 
focus-visible, reduced motion, dark mode o incluso en decidir si un dialogo debio ser una pagina. [S02] Por eso PXIL 
trata el catalogo como una herramienta dentro de un sistema mayor.
1.2 Objetivo operacional
Objetivo.  Dado un problema y un alcance parcial o completo, producir una especificacion de experiencia y 
software suficientemente precisa para que otro agente implemente el producto sin inventar decisiones criticas, y 
luego verificar la implementacion contra esa especificacion.
1.3 Principios no negociables
Principio
Regla
P1 - Scope before pixels
No se elige layout ni componente antes de conocer tareas, 
usuarios, datos y criticidad.
P2 - State completeness
Toda pantalla o componente con datos debe definir estados 
inicial, loading, success, empty, partial, error y permission-
denied cuando apliquen.
P3 - Action accountability
Toda accion mutante define permiso, confirmacion cuando 
aplique, resultado, feedback, auditoria y estrategia de 
recuperacion.
P4 - Recognition over recall
La interfaz reduce carga de memoria y hace visibles 
opciones/contexto, alineada con las heuristicas de Nielsen. 
[S21]
P5 - Accessible by construction
WCAG 2.2 AA es baseline para web salvo que el proyecto defina 
otro objetivo; componentes interactivos siguen patrones de 
teclado/semantica WAI-ARIA. [S19-S20]
P6 - Design system first
Tokens semanticos, componentes y patrones compartidos 
preceden al styling pantalla por pantalla. Figma tambien 
recomienda fundaciones, componentes, libraries y 
variables/tokens para escalar consistencia. [S22]
P7 - Security is a requirement
Autenticacion, autorizacion, validacion, logging y proteccion de 
datos se modelan desde requisitos, no al final. [S24-S28]
P8 - Traceability
Cada requisito debe poder rastrearse hasta una experiencia 
visible o una capacidad tecnica, y hasta una prueba.
P9 - Independent review
El agente que implementa no es el unico que aprueba. QA visual, 
accesibilidad y funcionalidad se ejecutan como roles 
independientes.
P10 - Learn only from approved artifacts
La memoria permanente se alimenta de componentes/patrones



## Page 5

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  5
adoptados y verificados, no de todo lo encontrado.
Figura 1. Arquitectura conceptual de PXIL.
2. Fundamentos investigados y estandares
La capa debe combinar disciplinas. Ningun estandar por si solo cubre un producto completo. La siguiente matriz 
muestra que problema resuelve cada familia de referencias y como se incorpora a PXIL.
Area
Base
Uso dentro de PXIL
Ingenieria de requisitos
ISO/IEC/IEEE 29148:2018 [S14]
Estructurar requisitos, atributos, relaciones, 
criterios de calidad y trazabilidad.
Arquitectura
ISO/IEC/IEEE 42010:2022 [S18]
Separar concerns, viewpoints, stakeholders 
y decisiones arquitectonicas.
Calidad de producto
ISO/IEC 25010:2023 [S15]
Convertir calidad no funcional en requisitos 
y gates.
Calidad en uso
ISO/IEC 25019:2023 [S16]
Evaluar la experiencia en contexto real de 
uso.
Calidad de datos
ISO/IEC 25012:2008 [S17]
Definir exactitud, integridad, consistencia y 
evaluacion de datos.
Human-centred design
ISO 9241-210:2019 [S11]
Mantener investigacion, contexto, usuarios, 
iteracion y evaluacion en el ciclo.
Interaccion
ISO 9241-110:2020 [S12]
Usar principios generales para 
diseno/evaluacion de interaccion.
Presentacion de informacion
ISO 9241-112:2025 [S13]
Asegurar percepcion y comprension de 
informacion visual/auditiva/haptica.
Usabilidad practica
Nielsen heuristics [S21]
Checklist de feedback, consistencia, control, 
prevencion de errores y recuperacion.
Accesibilidad
WCAG 2.2 + WAI-ARIA APG [S19-S20]
Criterios AA, foco, teclado, roles, estados y 
comportamiento de widgets.
Seguridad
OWASP ASVS 5.0 + NIST SSDF [S24,S26]
Requisitos verificables de seguridad 
integrados al SDLC.
Identidad
NIST SP 800-63-4 [S27]
Decisiones de identidad, enrollment, 
authenticators y federation segun riesgo.
Autorizacion
NIST RBAC + OWASP Authorization [S28]
Roles, permisos, restricciones y minimo 
privilegio.
Procesos/estados
BPMN 2.0.2 + SCXML [S32-S33]
Modelar workflows empresariales y 
maquinas de estado.
APIs
OpenAPI 3.1.1 + RFC 9457 [S29-S30]
Contratos HTTP y errores machine-readable.
Observabilidad
OpenTelemetry [S31]
Convenciones para trazas, metricas, logs y 
eventos.
Pruebas
ISTQB CTFL 4.0.1 [S36]
Capas de component, integration, system y 
acceptance testing.
Proceso de diseno
Double Diamond [S23]
Divergir/converger: Discover, Define, 
Develop, Deliver.



## Page 6

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  6
Criterio de aplicacion.  PXIL no pretende certificar cumplimiento ISO. Usa estas normas como bases de diseño y 
checklists verificables. Cuando un producto este regulado, la capa debe activar un pack de compliance especifico 
y exigir evidencia adicional.
3. Arquitectura operativa de PXIL
3.1 Las once funciones principales
Funcion
Responsabilidad
1. Intake & Scope Engine
Recolecta o infiere contexto, detecta huecos y decide si puede 
continuar o si debe plantear preguntas de alto valor.
2. Specification Graph
Convierte el brief en objetos versionados e identificables; 
mantiene dependencias y trazabilidad.
3. Domain Intelligence
Investiga el dominio, identifica capacidades esperables, reglas, 
vocabulario, workflows y riesgos.
4. UX/IA Architecture
Define usuarios, journeys, tareas, navegacion, jerarquias y 
patrones de interaccion.
5. Data/Security Architecture
Modela entidades, constraints, permisos, privacidad, auditoria y 
contratos.
6. Experience Contract
Produce inventario de pantallas, estados, eventos, mensajes, 
notificaciones y criterios de aceptacion.
7. Visual Direction
Define tokens, densidad, tipografia, color, iconografia, motion, 
grid y reglas responsive.
8. Component Intelligence
Busca en biblioteca privada y 21st oficial, inspecciona 
candidatos y propone familias compatibles.
9. Composition Planner
Decide layout y combinacion de componentes por pantalla; 
genera recetas implementables.
10. Build Orchestrator
Coordina agentes de implementacion y mantiene conformidad 
con contracts y design system.
11. QA & Learning
Ejecuta gates, registra findings, corrige, y promociona patrones 
aprobados a la biblioteca privada.
3.2 Artefactos como fuente de verdad
El sistema no debe depender de que un modelo "recuerde" decisiones en chat. Cada fase escribe artefactos 
persistentes. Esos artefactos son entradas de la fase siguiente y pueden validarse por schema. Esta separacion reduce 
drift, hace auditable el proceso y permite sustituir modelos sin perder arquitectura.
/pxil/
  project.yaml                 # identidad, objetivos, alcance, restricciones
  research/                    # evidencia de dominio y referencias
  spec/
    requirements.yaml          # REQ-xxx
    modules.yaml               # MOD-xxx
    personas.yaml              # ACT-xxx
    permissions.yaml           # PERM-xxx
    domain-model.yaml          # ENT-xxx / RULE-xxx
    flows.yaml                 # FLOW-xxx
    screens.yaml               # SCR-xxx
    states.yaml                # STA-xxx



## Page 7

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  7
    events.yaml                # EVT-xxx
    notifications.yaml         # NOTIF-xxx
    audit.yaml                 # AUD-xxx
    api.yaml                   # OpenAPI / API contracts
    data.yaml                  # entities, constraints, indexes
  design/
    design-tokens.json
    visual-direction.md
    component-manifest.json
    screen-recipes/
  qa/
    acceptance.yaml
    coverage-matrix.csv
    findings/
  library/
    approved-patterns/
    approved-components/
    provenance.json
3.3 Grafo de trazabilidad
Figura 2. Cada elemento debe poder rastrearse hasta requisito y prueba.
La regla operativa es sencilla: si un elemento no puede vincularse a un requisito, una necesidad de usuario, una regla 
de dominio o una exigencia de calidad, debe cuestionarse. Si un requisito no llega a pantalla, proceso, API o control 
verificable, esta incompleto.
4. Intake, discovery y cierre de alcance
4.1 Preguntar lo minimo que cambie decisiones
La capa no debe convertir cada solicitud en un interrogatorio. Primero extrae lo que ya esta disponible, investiga el 
dominio cuando sea apropiado y solo pregunta por ambiguedades que cambian sustancialmente arquitectura, 
cumplimiento, roles, dinero, datos sensibles o integraciones. ISO 9241-210 exige entender contexto de uso; Double 
Diamond enfatiza entender antes de asumir. [S11,S23]
Bloque
Preguntas/variables que el motor debe resolver
Objetivo
Que resultado de negocio se busca? Que tarea central debe 
mejorar? Que indica exito?
Usuarios
Quienes usan el producto? Que roles existen? Nivel tecnico? 
Frecuencia y contexto de uso?
Scope
Que entra en v1? Que queda explicitamente fuera? Que 
capacidades son obligatorias?



## Page 8

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  8
Datos
Que datos se crean/leen/modifican? Sensibilidad? Fuentes? 
Volumen? Retencion? Import/export?
Dinero
Hay pagos, saldos, creditos, impuestos, ledger o conciliacion? 
Se necesita inmutabilidad/auditoria especial?
Integraciones
APIs externas, correo, WhatsApp, ERP, bancos, mapas, storage, 
webhooks, SSO?
Regulacion
Sector, paises, privacidad, accesibilidad, auditoria, requisitos 
contractuales?
Plataformas
Web/mobile/PWA/desktop? Breakpoints? Offline? Dispositivos 
especiales?
Identidad
Publico, interno, multi-tenant? MFA? invitaciones? recovery? 
SSO?
Operacion
Soporte, administracion, feature flags, observabilidad, backups, 
importaciones y jobs?
Marca
Identidad existente o se crea? tono? contenido? light/dark? 
densidad?
Tecnologia
Stack obligatorio, restricciones de hosting, DB, browser support 
y presupuesto?
4.2 Confidence ledger
Cada decision recibe estado: CONFIRMED, INFERRED, RESEARCHED, ASSUMED o OPEN. Las decisiones ASSUMED 
deben declarar impacto y ser reversibles; las OPEN que bloquean seguridad, modelo de datos o dinero no pueden 
cruzar el gate de especificacion.
Estado
Significado
Accion
CONFIRMED
Dado explicitamente por stakeholder o 
fuente primaria.
Usar.
RESEARCHED
Derivado de evidencia externa actual y 
pertinente.
Usar y citar.
INFERRED
Derivacion fuerte a partir del scope.
Usar si el coste de equivocarse es bajo; 
marcar.
ASSUMED
Eleccion provisional para avanzar.
Documentar alternativa y trigger de 
revision.
OPEN
No hay informacion suficiente.
Resolver antes del gate correspondiente.
4.3 Gate G0 - Brief Ready
• Objetivo principal y actores identificados.
• Scope in/out explicitado.
• Riesgos de dominio y datos sensibles detectados.
• Plataformas y restricciones conocidas.
• Preguntas bloqueantes resueltas o registradas como OPEN con gate futuro.
• Definition of success definida al menos cualitativamente.



## Page 9

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  9
5. Ingenieria de requisitos y grafo de trazabilidad
ISO/IEC/IEEE 29148 trata la ingenieria de requisitos como una actividad de ciclo de vida y proporciona guias para 
procesos y artefactos de requisitos. [S14] PXIL traduce esa disciplina a objetos compactos que una IA puede consumir 
y verificar.
5.1 Tipos de requisitos que PXIL separa
Tipo
Ejemplos
Business
Reducir tiempo de conciliacion; permitir cierres mensuales; 
aumentar conversion.
User
Un contador puede importar movimientos y resolver 
discrepancias sin perder contexto.
Functional
Crear factura; aprobar gasto; filtrar transacciones; exportar 
reporte.
Data
Monto usa precision definida; moneda obligatoria; FK; unique; 
versionado.
Interaction
Guardar muestra progreso; exito devuelve estado; error 
preserva input.
Security
Solo rol autorizado puede aprobar; reautenticacion para accion 
sensible.
Privacy
Minimizar datos; justificar finalidad; retencion y deletion policy.
Accessibility
Operable por teclado; foco visible; labels programaticos; 
contraste AA.
Performance
Objetivos de respuesta por operacion y limites de volumen 
definidos.
Reliability
Idempotencia; retries; recuperacion ante fallos parciales.
Observability
Evento y trace definidos para transacciones criticas; correlation 
id.
Operational
Backups, restore, admin tools, migration, support y runbooks.
5.2 Plantilla de requisito
id: REQ-FIN-042
kind: functional
statement: "El usuario con permiso expense.approve puede aprobar un gasto pendiente."
rationale: "Separacion de funciones y control financiero."
source: stakeholder
priority: must
actors: [ROLE-ACCOUNTANT, ROLE-ADMIN]
preconditions: ["expense.status == pending"]
related: [FLOW-EXP-03, SCR-EXP-DETAIL, EVT-EXP-APPROVE]
quality_constraints: [AUD-007, PERM-014]
acceptance:
  - "sin permiso -> 403 y UI no muestra la accion"
  - "exito -> status=approved, toast, audit event"
  - "conflicto de version -> no sobrescribir; pedir refresh"
confidence: confirmed



## Page 10

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  10
5.3 Matriz de cobertura
El QA de especificacion calcula cobertura en ambos sentidos: requisitos sin realizacion y elementos sin requisito. 
Antes de implementar, los MUST deben tener rutas de realizacion y prueba. La matriz tambien permite detectar 
pantallas decorativas sin valor y funcionalidades invisibles sin UI/operacion.
6. Modelado de dominio, modulos y reglas
6.1 Domain pack antes del UI pack
Cuando el usuario dice "sistema de finanzas", "ERP", "CRM", "inventario" o "clinica", PXIL no debe responder con un 
dashboard generico. Activa un Domain Research Agent que define vocabulario, capacidades esperables, procesos, 
entidades, reglas y riesgos; luego el Scope Engine decide cuales aplican. El conocimiento del dominio nunca se 
convierte automaticamente en scope: se presenta como cobertura candidata.
6.2 Capabilities vs modules vs screens
Concepto
Definicion
Ejemplo
Capability
Lo que el negocio debe poder hacer.
Conciliar movimientos bancarios.
Module
Agrupacion funcional coherente.
Banking & Reconciliation.
Feature
Comportamiento concreto.
Auto-match por monto/fecha/referencia.
Flow
Secuencia para lograr una meta.
Importar -> detectar matches -> resolver 
-> cerrar.
Screen
Superficie visual que soporta tareas.
Reconciliation Workspace.
Component
Pieza reutilizable de UI.
Match confidence chip, transaction table.
6.3 Reglas y estados de dominio
Las entidades importantes se modelan como maquinas de estado cuando tienen ciclo de vida. SCXML es una 
recomendacion W3C para describir state machines; BPMN es una especificacion OMG adecuada para procesos 
empresariales de varios actores. [S32-S33] PXIL no obliga a serializar siempre en esos formatos, pero adopta su forma 
de pensar: estados explicitos, eventos, guards y efectos.
entity: Invoice
states: [draft, issued, partially_paid, paid, void, overdue]
transitions:
  - event: issue
    from: draft
    to: issued
    guard: "lines.length > 0 && customer_id != null"
  - event: register_payment
    from: [issued, partially_paid, overdue]
    to: "derived_from_balance"
  - event: void
    from: [issued, overdue]
    to: void
    requires_permission: invoice.void
    audit: mandatory
6.4 SOLID y separacion de concerns
SOLID no se usa como decoracion documental. PXIL lo traduce a restricciones de composicion: pantallas no contienen 
reglas de negocio irrepetibles; validaciones de dominio viven en servicios/domain; componentes visuales reciben



## Page 11

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  11
contratos estables; acceso a datos se abstrae donde aporta testabilidad; las dependencias de alto nivel no quedan 
atadas a detalles de UI. El objetivo es que cambiar un componente 21st no cambie reglas financieras y que cambiar la 
persistencia no reescriba flujos de usuario.
7. Datos, normalizacion e integridad
El diseno visual depende del modelo de datos: filtros, tablas, formularios, estados, historial y permisos nacen de 
entidades y relaciones. Microsoft resume normalizacion como organizar datos y relaciones para reducir redundancia e 
inconsistencias; sus materiales cubren normalizacion, integridad referencial y constraints. [S35] ISO/IEC 25012 aporta 
un marco de calidad de datos. [S17]
7.1 Politica de modelado
• Normalizar transaccionalmente hasta 3NF como default razonable, salvo denormalizacion documentada por 
lectura/performance.
• Definir PK, FK, UNIQUE, CHECK, NOT NULL y DEFAULT en base de datos cuando la regla de integridad pertenece a 
los datos.
• Usar tipos correctos: dinero con precision fija/decimal segun stack; timestamps con timezone strategy explicita; 
enums solo cuando su evolucion este controlada.
• Separar identidad tecnica de identificadores visibles cuando sea util (UUID interno vs invoice_number).
• Definir ownership/tenant en toda entidad multi-tenant y aplicar control a nivel de query/policy.
• Distinguir borrado real, soft delete, archival y retention. No adoptar soft delete por defecto sin motivo.
• Modelar historial cuando el negocio necesita saber quien cambio que y cuando. Auditoria no es igual a una columna 
updated_at.
• Definir concurrencia: optimistic locking/version number para ediciones donde el overwrite silencioso sea peligroso.
• Definir idempotency keys para operaciones repetibles por red que no pueden duplicarse, especialmente dinero y 
webhooks.
7.2 Entidad -> formulario -> tabla -> auditoria
El Data Architect entrega Field Contracts que especifican tipo, obligatoriedad, formato, validacion, sensibilidad, 
permisos de lectura/escritura, representacion, busqueda, ordenamiento y exportacion. Esto evita formularios genericos 
y tablas que exponen campos incorrectos.
Campo contract
Preguntas
Semantica
Que representa? Unidad? moneda? timezone? locale?
Input
Libre, selector, lookup, autocomplete, masked, read-only?
Validation
Cliente + servidor + constraint DB? Mensaje? rango? 
dependencia?
Security
Quien puede verlo/editarlo? Se cifra? se enmascara?
UX
Label, helper, placeholder solo si aporta, ejemplo, default, 
required indicator.
Table
Visible? sortable? filterable? aggregatable? exportable?
Audit
Debe registrarse before/after? actor? reason? source?



## Page 12

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  12
8. Roles, permisos, seguridad, privacidad y auditoria
OWASP ASVS 5.0 es un conjunto abierto de requisitos verificables de seguridad para aplicaciones web y servicios. 
NIST SSDF indica que las practicas de seguridad deben integrarse al SDLC porque muchos modelos de ciclo de vida 
no las cubren en detalle. [S24,S26] PXIL convierte esto en requisitos tempranos y gates.
8.1 Authorization model
RBAC asocia acciones permitidas a roles, no directamente a individuos. NIST lo define como un modelo de acceso 
donde las acciones permitidas sobre recursos se identifican con roles. [S28] PXIL puede ampliar RBAC con 
atributos/ownership cuando el dominio lo exija, pero siempre materializa una Permission Matrix.
Rol / permiso
view
create
edit
approve
void
export
admin
Owner/Admin
Y
Y
Y
Y
Y
Y
Y
Accountant
Y
Y
Y
Y
N
Y
N
Reviewer
Y
N
N
Y
N
Y
N
Viewer
Y
N
N
N
N
Y*
N
* Ejemplo: export puede limitarse por sensibilidad. La matriz real debe ser por recurso + accion + scope, no solo por 
pantalla.
8.2 Auditoria como producto visible
OWASP diferencia logs de seguridad, logs operativos y audit/transaction trails; cada uno tiene propositos distintos. 
[S25] Por eso PXIL especifica tanto el evento que se registra como la experiencia de consulta del historial cuando el 
usuario necesita trazabilidad.
audit_event:
  id: AUD-EXP-APPROVED
  event: expense.approved
  actor: user_id
  subject: expense_id
  tenant: tenant_id
  timestamp: server_time
  correlation_id: required
  before: {status: pending}
  after: {status: approved}
  reason: optional_or_required_by_policy
  source: web|api|automation
  ip/device: policy-dependent
  sensitive_fields: never_log_raw
8.3 Privacy and data minimization
El NIST Privacy Framework propone un enfoque flexible y basado en riesgo para gestionar privacidad durante el 
desarrollo de productos y servicios. [S37] PXIL pregunta finalidad, minimizacion, acceso, retencion, export/delete, 
terceros y exposicion en UI. La legislacion concreta depende de jurisdiccion y sector; la capa no debe asumir que un 
framework voluntario equivale a cumplimiento legal.
8.4 Identity journeys
NIST SP 800-63-4, publicado en 2025, cubre identity proofing, enrollment, authenticators, management, protocols y 
federation. [S27] PXIL debe diseñar, cuando apliquen: registro, invitacion, login, MFA, recovery, cambio de 
email/telefono, cambio de password, sesiones, dispositivos, reautenticacion para acciones sensibles, logout global y 
estados de cuenta suspendida/bloqueada.



## Page 13

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  13
9. Arquitectura UX e informacion
9.1 Del dominio a la arquitectura de informacion
La navegacion se deriva de las tareas y objetos del dominio, no de una lista arbitraria de pantallas. ISO 9241-110 
proporciona principios generales de interaccion; Nielsen enfatiza visibilidad del estado, consistencia, control, 
prevencion de errores y reconocimiento. [S12,S21]
Trabajo UX
Entregable
Context of use
Usuarios, dispositivos, frecuencia, ambiente, restricciones.
Jobs/tasks
Top tasks, frecuencia, criticidad, secuencia y dependencia.
Information architecture
Mapa jerarquico de objetos, modulos y rutas.
Navigation model
Global/local/contextual navigation, breadcrumbs, 
command/search.
Journey map
Pasos, decisiones, pain points, touchpoints y outcomes.
Task flow
Happy path + alternative + exception + recovery.
Content model
Titulos, labels, helper/error/success copy, empty-state 
guidance.
Usability criteria
Tiempo/tasa de exito/errores/satisfaccion segun tareas criticas.
9.2 Progressive disclosure y densidad
Un producto empresarial puede necesitar alta densidad sin convertirse en ruido. PXIL clasifica cada pantalla como 
focus, browse, analyze, operate o configure. Esa clasificacion condiciona densidad, numero de columnas, uso de 
panels, tablas, filtros persistentes, shortcuts y modales. La estetica premium surge de jerarquia y consistencia, no de 
hacer todo grande o vacio.
9.3 Search, filter, sort y bulk operations
Para colecciones relevantes, PXIL evalua sistematicamente: busqueda, filtros guardables, sorting, 
paginacion/virtualizacion, seleccion multiple, bulk actions, export, column customization y persistencia de 
preferencias. No todas aplican, pero deben ser evaluadas en vez de olvidadas.
10. Pantallas, estados, eventos y microinteracciones
10.1 Screen Contract
Cada pantalla se documenta como contrato, no como screenshot. Debe declarar proposito, usuario, datos, acciones, 
componentes, estados, permissions, eventos, responsive y criterios de aceptacion.
id: SCR-EXP-LIST
route: /expenses
purpose: "encontrar, revisar y actuar sobre gastos"
actors: [admin, accountant, reviewer]
data: [expenses, categories, vendors, approval_status]
actions: [search, filter, sort, create, open, bulk_export]
states: [loading, loaded, empty, no_results, partial_error, offline]
permissions:
  create_button: expense.create
  approve_action: expense.approve
responsive:
  desktop: data_table



## Page 14

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  14
  mobile: compact_list + filter_sheet
analytics: [screen_view, filter_applied, expense_opened]
acceptance: [TST-UX-031, TST-A11Y-014, TST-FUNC-088]
10.2 State completeness matrix
Estado
Que debe decidir el diseño
Initial
Que ve antes de interaccion? Hay datos cached?
Loading
Skeleton/spinner/progress? bloquear toda pantalla o solo 
region? cancelable?
Loaded
Jerarquia y acciones disponibles.
Empty-first-use
Explica valor + CTA para empezar.
Empty-filtered
Diferencia "no hay datos" de "filtros no encuentran".
Success
Feedback inline/toast/redirect? persistencia del mensaje?
Validation error
Campo + summary cuando aplica; preservar input.
Server error
Mensaje util, retry, correlation/support info si procede.
Partial failure
Que parte funciona? Que se puede reintentar?
Permission denied
Ocultar/disable? explicar? route 403?
Offline
Lectura cached? cola? acciones bloqueadas?
Conflict
Datos cambiaron en otro lugar; merge/refresh/retry.
Unsaved changes
Prevencion de perdida; autosave o confirmacion.
Destructive confirmation
Consecuencia, objeto afectado, reversible/undo?
Long-running
Progreso; background job; notificacion al completar.
10.3 Event contract: click -> effect -> feedback
Paso
Contenido
Trigger
click, submit, keypress, drag, timer, webhook, background 
completion.
Precondition
permiso, estado valido, network, required fields, selection.
Immediate UI
pressed/loading/optimistic update/disable duplicate action.
Command
API call, local state, job enqueue, navigation.
Success
state transition, data refresh, toast/banner, focus target, 
analytics.
Failure
rollback, field error, global error, retry, preserve context.
Side effects
notification, webhook, audit, cache invalidation, downstream 
job.
Accessibility
focus management, live region, keyboard behavior.
Observability
trace/span/event/correlation id.



## Page 15

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  15
10.4 Feedback: elegir el mecanismo correcto
WAI-ARIA diferencia alertas no interruptivas de alert dialogs que requieren respuesta; Apple recomienda usar alerts 
con moderacion y progress indicators para mostrar que una operacion continua. [S20] La capa debe mapear severidad 
y necesidad de accion a inline feedback, toast, banner, modal, alert dialog, progress indicator o notification center.
11. Sistema visual y design system
Figma define las fundaciones de un design system como los bloques visuales y funcionales, e incluye accesibilidad, 
color, tipografia, iconografia, componentes, variables y tokens. [S22] PXIL agrega comportamiento, state matrix y code 
provenance para que el sistema sirva a agentes, no solo a diseñadores.
11.1 Design DNA
Dimension
Variables obligatorias
Color
primitives + semantic tokens + light/dark + status + data-viz 
palette.
Typography
families, scale, weights, line heights, numeric/tabular options.
Spacing
base scale, container paddings, density modes.
Shape
radii, border widths, dividers, elevation/shadows.
Layout
max widths, grids, sidebar/header dimensions, breakpoints.
Motion
durations, easing, enter/exit, reduced-motion alternatives.
Iconography
library, stroke/fill rules, sizes, labels/tooltips.
Content
voice/tone, capitalization, date/currency/number formats.
Data visualization
chart types, color rules, axes, tooltips, empty/error states.
Focus/interaction
hover, active, focus-visible, disabled, selected, pressed, drag.
11.2 Token architecture
color.gray.950                 # primitive
color.gold.500                 # primitive
surface.canvas                 # semantic
surface.raised
text.primary
text.muted
border.default
border.focus
status.success.surface
status.danger.text
space.1 / 2 / 3 / 4 / 6 / 8
radius.sm / md / lg
type.body.sm / body.md / title.lg
motion.fast / normal / slow
11.3 Premium UI: criterios concretos
• Jerarquia: un primary action claro; secundarios visualmente subordinados.
• Ritmo: spacing consistente y repetible; evitar ajustes ad hoc por pantalla.
• Densidad contextual: analytics y tablas pueden ser densos; onboarding y tareas enfocadas necesitan mas aire.



## Page 16

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  16
• Tipografia: pocos tamaños, diferencias suficientes, alineacion numerica en data-heavy UI.
• Superficies: usar elevation, borders y color con proposito; no decorar cada card.
• Color: status semantico consistente; nunca depender solo del color para significado.
• Motion: ayuda a comprender cambios; no se usa para impresionar y respeta reduced motion.
• Responsive: redistribuir tareas, no solo encoger; tablas complejas necesitan estrategia movil.
Anti-pattern de IA.  Evitar el "AI luxury look" repetitivo: glassmorphism excesivo, gradientes arbitrarios, glow 
dorado en todo, enormes hero headings dentro de apps, cards para cualquier bloque, iconos sin semantica y 
animaciones que compiten con la tarea. PXIL evalua utilidad antes de estetica.
12. 21st.dev: recuperacion, inspeccion y biblioteca 
privada
12.1 Que ofrece hoy 21st
21st se presenta como un catalogo de componentes React/Tailwind compatibles con shadcn, themes y templates, con 
busqueda y recuperacion mediante CLI/MCP. Sus skills oficiales incluyen 21st-cli-use, 21st-ai, 21st-registry, 21st-
design-sync y skills enfocadas en explorar, construir y revisar UI. [S03-S04] El MCP puede devolver previews visuales 
en hosts que soportan MCP Apps. [S05]
12.2 Restriccion legal que define la arquitectura
No construir un crawler.  Los Terms of Service actuales prohiben scraping/automatic collection del Marketplace y 
entrenar sistemas de IA con su contenido/datos sin consentimiento escrito; tambien restringen reutilizacion de 
previews/media y metadata. [S01] Esto descarta el mirror visual masivo inicialmente propuesto.
12.3 Flujo compliant
• Buscar por MCP/CLI oficial con consultas derivadas del Screen Recipe.
• Solicitar 8-20 candidatos segun criticidad, en lugar de aceptar el primero.
• Usar previews oficiales solo para decision en el flujo permitido por la plataforma; no archivarlos como dataset 
propio.
• Recuperar/instalar codigo por los mecanismos oficiales cuando un candidato sea seleccionado.
• Registrar provenance: source=21st, author/ref/URL/licence cuando este disponible y fecha de adopcion.
• Renderizar el componente dentro de nuestro Storybook/sandbox local con nuestros tokens y generar screenshots 
propios.
• QA visual, responsive, accessibility, dependency/security y comportamiento.
• Si se aprueba, publicar o almacenar la version adaptada en una biblioteca privada del equipo respetando 
derechos/licencias.
12.4 Visual Intelligence Catalog propio
La biblioteca privada si puede ser rica porque contiene trabajo propio o componentes adoptados con derechos de uso. 
La memoria no guarda "lo bonito que vi"; guarda evidencia util de lo que funciono en nuestro contexto.
component_record:



## Page 17

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  17
  id: viltrum.data-table.enterprise.v2
  provenance:
    source: 21st|internal|custom
    original_ref: optional
    license: verified
  visual:
    local_screenshot: ./previews/...
    density: high
    aesthetic_tags: [editorial, restrained, enterprise]
  behavior:
    states: [loading, empty, error, selected, editing]
    keyboard: verified
    responsive: [desktop, tablet, mobile-strategy]
  compatibility:
    family: enterprise-neutral-v2
    works_with: [filter-bar-v3, command-menu-v1]
  quality:
    a11y: pass
    visual_qa: pass
    build: pass
    dependencies: reviewed
  usage:
    best_for: [finance-ledger, crm-records, audit-log]
    avoid_for: [marketing-grid]
12.5 Seleccion por familia, no por pieza
El Composer evalua coherencia entre shell, navigation, page header, filters, tables/cards, forms, dialogs y feedback. 
Un componente puede ser excelente aislado y aun ser incorrecto para la familia visual. La seleccion favorece 
compatibilidad, token fit, densidad y patrones de interaccion comunes.



## Page 18

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  18
13. Antigravity: plugin, skills, agentes y reglas
Antigravity actualmente puede orquestar agentes, subagentes, browser, MCP, skills, rules y plugins. Sus plugins 
pueden empaquetar skills, background subagents, linting rules, MCP servers y hooks. [S06-S10] Esta estructura encaja 
directamente con PXIL.
Figura 3. Topologia propuesta de agentes especializados.
13.1 Estructura de plugin
plugins/pxil/
  plugin.json
  mcp_config.json                # 21st y otras fuentes autorizadas
  hooks.json                     # gates / validators
  rules/
    invariants.md
    security-baseline.md
    accessibility-baseline.md



## Page 19

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  19
  agents/
    orchestrator.md
    requirements-analyst.md
    domain-analyst.md
    ux-architect.md
    interaction-architect.md
    data-architect.md
    security-privacy.md
    visual-director.md
    21st-scout.md
    visual-inspector.md
    composer.md
    frontend-builder.md
    functional-qa.md
    accessibility-qa.md
    visual-qa.md
    library-curator.md
  skills/
    pxil-intake/SKILL.md
    pxil-domain-model/SKILL.md
    pxil-requirements/SKILL.md
    pxil-flow-design/SKILL.md
    pxil-screen-contract/SKILL.md
    pxil-state-events/SKILL.md
    pxil-design-system/SKILL.md
    pxil-21st-retrieval/SKILL.md
    pxil-component-evaluation/SKILL.md
    pxil-compose/SKILL.md
    pxil-visual-qa/SKILL.md
    pxil-a11y-qa/SKILL.md
    pxil-production-readiness/SKILL.md
13.2 Por que skills y no un prompt gigante
Antigravity distingue Rules - restricciones persistentes - de Skills - workflows multi-step. Las rules tienen 
presupuestos de contexto y los workflows heredados estan siendo reemplazados por Agent Skills, que cargan 
instrucciones de forma progresiva y pueden incluir scripts/referencias/assets. [S08,S10] Por eso el "cerebro" debe 
estar en artefactos + skills, no en un GEMINI.md enorme.
13.3 Regla vs skill vs agent
Mecanismo
Usar para
Ejemplo
Rule
Invariantes cortos y siempre aplicables.
"No implementar un formulario sin 
estados error/success."
Skill
Procedimiento reusable con pasos, 
schemas y validators.
pxil-screen-contract
Agent
Rol con autoridad/herramientas limitadas.
Visual QA no programa hasta reportar 
findings.
Hook
Validacion automatica antes/despues de 
eventos.
Bloquear merge si coverage < threshold.
MCP
Contexto/capacidades externas 
autorizadas.
21st search/get; design tools; issue 
tracker.
13.4 Orquestacion paralela
El Orchestrator puede ejecutar en paralelo Domain Research, UX patterns, Security/Compliance y Data Architecture 
despues de G0. Debe converger resultados antes de Experience Contract. Durante implementacion, se paralelizan



## Page 20

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  20
clusters de pantallas solo cuando comparten contracts/tokens estables. QA se mantiene independiente para evitar 
auto-aprobacion.
14. Composicion, implementacion y quality gates
14.1 Screen Recipe
Antes de codigo, Composer entrega una receta. Esto reduce libertad accidental del builder y hace repetibles los 
resultados.
screen_recipe: SCR-RECON-WORKSPACE
intent: analyze_operate
layout:
  shell: enterprise-sidebar-v2
  header: compact-context-header
  regions:
    - reconciliation-summary
    - filter-command-bar
    - unmatched-transactions-grid
    - candidate-match-panel
visual_constraints:
  density: high
  decorative_effects: minimal
  radius: md
  typography: tabular_numbers_for_money
components:
  - ref: private/data-grid-v4
  - ref: private/filter-bar-v3
  - source_query: "transaction match confidence compact panel"
responsive:
  desktop: split_view
  tablet: panel_drawer
  mobile: sequential_task_flow
must_show_states: [loading, empty, no_results, partial_error, conflict]
14.2 Gates
Gate
Condicion
G0 Brief Ready
Objetivo/scope/actores/riesgos minimos resueltos.
G1 Spec Coverage
MUST requirements trazados a modules/flows.
G2 Domain/Data Ready
Entidades, reglas, estados y permisos criticos definidos.
G3 Experience Ready
Pantallas + states + events + copy/feedback + responsive.
G4 Visual System Ready
Tokens, families, typography, color, density y a11y baseline.
G5 Composition Ready
Cada pantalla tiene recipe y componentes/provenance plan.
G6 Build Ready
Interfaces/API/contracts estables; tasks particionadas.
G7 Verification
Functional + integration + system + a11y + visual + security 
checks.
G8 Production Ready
Observability, migrations, backup/restore, docs, support y 
rollout.



## Page 21

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  21
14.3 Repair loop
Visual QA captura viewport real, compara contra receta y design tokens, clasifica findings por tipo y devuelve cambios 
concretos. Despues vuelve a renderizar. El loop termina por criterios, no porque el builder "cree que ya se ve bien".
15. Pruebas, accesibilidad, rendimiento y observabilidad
15.1 Estrategia de pruebas
ISTQB distingue component, component integration, system, system integration y acceptance testing, y separa 
functional de non-functional testing. [S36] PXIL utiliza esa separacion para construir una Test Matrix desde los 
contracts.
Nivel
Que valida PXIL
Static/schema
Artifacts validos, IDs unicos, referencias existentes, coverage.
Unit/component
Reglas puras, formatters, components, reducers/state 
machines.
Integration
UI-servicio, DB constraints, third-party adapters, auth.
Contract
OpenAPI/schema compatibility, RFC 9457 errors, webhooks.
E2E/system
Journeys criticos completos con roles reales.
Acceptance
Outcomes del usuario y negocio en entorno representativo.
Visual regression
Layouts, tokens, breakpoints, themes, accidental drift.
Accessibility
Automated + keyboard + focus + screen reader spot tests.
Security
ASVS-targeted checks, authz, input, session, secrets, logging.
Performance
Response/render targets, data volume, long tasks, concurrency.
Resilience
timeouts, retries, idempotency, partial outages, recovery.
15.2 Accessibility Definition of Done
• WCAG 2.2 AA target para web por defecto; excepciones documentadas.
• Todo interactivo usable por teclado; focus visible y orden logico.
• Dialogos contienen foco y lo devuelven correctamente; roles/labels adecuados segun APG. [S20]
• Alerts/live feedback anunciado sin robar foco cuando no corresponde.
• Labels persistentes; placeholder no sustituye label.
• Errores identifican campo, problema y recuperacion; resumen cuando el flujo lo necesita.
• Status no depende exclusivamente de color.
• Touch targets, zoom/reflow y responsive verificados.
• Motion respeta prefers-reduced-motion.
• Tables vs grids elegidos segun interactividad; semantica nativa preferida cuando es suficiente.
15.3 Observability contract
OpenTelemetry proporciona convenciones comunes para traces, metrics, logs y events. [S31] PXIL no obliga a un 
vendor, pero cada flujo critico define señales suficientes para responder: que fallo, a quien afecto, en que paso y con 
que correlacion.



## Page 22

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  22
FLOW-PAYMENT-POST:
  traces:
    - payment.post
    - ledger.write
    - notification.dispatch
  metrics:
    - payment_post_duration_ms
    - payment_post_failures_total
  events:
    - payment.posted
    - payment.failed
  logs:
    - structured; correlation_id required
  pii_policy:
    - never log account secrets or raw sensitive payloads
15.4 Error contracts
RFC 9457 define un formato machine-readable de problem details para HTTP APIs. [S30] Si backend y frontend 
comparten tipos de error estables, PXIL puede mapearlos a feedback coherente y pruebas automatizadas en lugar de 
mostrar "Something went wrong" para todo.
16. Ejemplo completo: "diseña un sistema de finanzas"
16.1 Lo que PXIL no haria
No empezaria buscando un "finance dashboard" y pegando cards. Primero determinaria que significa finanzas en este 
contexto. Un sistema personal, bookkeeping pyme, tesoreria empresarial y un core bancario comparten palabras pero 
no alcance, riesgo ni flujo.
16.2 Preguntas de alto impacto
• Tipo: finanzas personales, pyme, contabilidad, tesoreria, lending, pagos o ERP?
• Usuarios: owner, accountant, reviewer, employee, auditor, customer?
• Contabilidad formal: chart of accounts y double-entry ledger o solo cash tracking?
• Multi-company / multi-currency / tax jurisdictions?
• Bank feeds y conciliacion? manual, CSV o API?
• Accounts payable/receivable, invoices, expenses, purchase approvals?
• Budgeting/forecasting? inventory/cost accounting?
• Se mueve dinero realmente o solo se registra? Si mueve dinero, que proveedor/regulacion aplica?
• Necesita immutable audit/history, approvals y separation of duties?
• Reportes obligatorios y periodo de cierre?
• Volumen, integraciones, import/export y roles externos?
16.3 Supuesto de ejemplo
Para mostrar el metodo, asumimos una plataforma web multi-tenant para pymes: bookkeeping operacional, facturas, 
gastos, cuentas bancarias importadas, conciliacion, presupuesto basico, reportes, roles y auditoria. No mueve fondos 
ni presenta impuestos automaticamente. Es un supuesto pedagogico, no una recomendacion de scope.



## Page 23

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  23
16.4 Mapa de modulos candidatos
Modulo
Alcance candidato
MOD-01 Dashboard
KPIs, cash position, alerts, tasks pendientes.
MOD-02 Chart of Accounts
cuentas, tipos, jerarquia, status, opening balances.
MOD-03 Ledger & Journal
journal entries, lines debit/credit, posting, reversal.
MOD-04 Banking
accounts, imports, bank transactions, rules.
MOD-05 Reconciliation
matching, discrepancies, closing per period.
MOD-06 Sales / AR
customers, invoices, payments recorded, aging.
MOD-07 Expenses / AP
vendors, expenses/bills, approvals, due dates.
MOD-08 Budget
budget lines, actual vs budget, periods.
MOD-09 Reports
P&L, balance sheet, cash flow, aging, custom exports.
MOD-10 Files
receipts, invoice attachments, evidence.
MOD-11 Notifications
approval, overdue, import/reconciliation completion.
MOD-12 Audit & Activity
business trail, security events, exports.
MOD-13 Team & Access
users, invitations, roles, permissions.
MOD-14 Settings
company, fiscal periods, currencies, numbering, integrations.
16.5 Pantallas que un generador superficial suele olvidar
• Invitation acceptance; suspended account; MFA/recovery if enabled.
• No-company / company switcher / first-company onboarding.
• Import wizard: mapping columns, preview, invalid rows, duplicate detection, result summary.
• Reconciliation conflict and partial import states.
• Period close/locked-period state and attempt to edit locked records.
• Approval inbox plus rejected/request-changes flow.
• Audit log detail with before/after and actor/source.
• Permission denied for deep links, not just hidden buttons.
• Global search/command palette and no-results.
• Export job running/completed/failed states.
• Integration disconnected/expired credentials/reconnect.
• Notification preferences and delivery failure where relevant.
• Destructive company/data actions with confirmation and recovery policy.
16.6 Ejemplo de flujo: aprobar gasto
FLOW-EXP-APPROVE
Actor: Accountant with expense.approve
Entry: expense detail or approval inbox
1. User opens expense -> system loads expense + policy + history.
2. If already changed by another user -> show latest status; disable invalid action.
3. User chooses Approve.
4. If policy requires comment/2nd approver -> collect required input.
5. Submit with record version.
6. Backend validates permission + tenant + state + version.



## Page 24

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  24
7a. Success -> status approved; audit event; refresh totals; toast; focus to status.
7b. Version conflict -> no overwrite; show conflict panel and Reload.
7c. Validation/business rule -> inline explanatory error; preserve context.
7d. Network/server -> retry option; action becomes enabled again safely.
8. Notification is sent if policy requires it.
9. Trace and correlation id link UI failure to backend operation.
16.7 Ejemplo de screen recipe financiero
Una pantalla de conciliacion es una herramienta de operacion/análisis, por tanto la direccion visual debe privilegiar 
lectura de datos, numeros tabulares, comparacion y acciones rapidas. Un hero grande o cards decorativas degradarian 
la tarea. PXIL buscaria componentes de data grid, filter/command bar, split panel, badges de confidence y dialogs 
accesibles, y los probaria con datos reales antes de aprobar la familia.
17. Contratos machine-readable y schemas
17.1 Identificadores y versionado
Prefijo
Objeto
REQ
Requirement
ACT
Actor/persona/role
MOD
Module
ENT
Entity
RULE
Business rule
FLOW
Flow
SCR
Screen
STA
State
EVT
Event/command
PERM
Permission
NOTIF
Notification
AUD
Audit event
API
Endpoint/contract
CMP
Component/pattern
TST
Test/acceptance
Todos los objetos tienen id estable, version/revision, status, source/confidence, links y owner. Los cambios 
incompatibles generan migration notes. Los agentes no renumeran IDs para "ordenar".
17.2 Screen schema minimo
{
  "$schema": "pxil.screen.v1",
  "id": "SCR-001",
  "name": "...",
  "purpose": "...",
  "actors": ["ACT-..."],
  "requirements": ["REQ-..."],
  "route": "/...",



## Page 25

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  25
  "dataDependencies": ["ENT-..."],
  "permissions": ["PERM-..."],
  "states": ["STA-..."],
  "events": ["EVT-..."],
  "regions": [],
  "responsive": {},
  "accessibility": {},
  "analytics": [],
  "acceptanceTests": ["TST-..."]
}
17.3 Event schema minimo
{
  "$schema": "pxil.event.v1",
  "id": "EVT-001",
  "trigger": "user|system|webhook|timer",
  "action": "...",
  "preconditions": [],
  "permission": "PERM-...",
  "command": {"api": "API-..."},
  "optimistic": false,
  "success": {"transition": "STA-...", "feedback": "..."},
  "errors": [
    {"type": "validation", "ui": "inline"},
    {"type": "conflict", "ui": "conflict_panel"},
    {"type": "system", "ui": "retryable_banner"}
  ],
  "audit": "AUD-...",
  "telemetry": {"event": "...", "trace": true}
}
17.4 Component evaluation schema
candidate:
  source: private|21st_official
  ref: "..."
  evaluated_against: CMP-REQ-019
  fit:
    task: 0..1
    visual_family: 0..1
    density: 0..1
    token_adaptability: 0..1
    responsive: 0..1
    accessibility: pass|fail|unknown
    dependency_cost: low|medium|high
  blockers: []
  decision: adopt|adapt|reject
  evidence: local_render_path
Las puntuaciones internas no sustituyen criterio; sirven para comparar candidatos con el mismo brief. Un fail de 
accesibilidad o licenciamiento puede ser blocker aunque el visual fit sea alto.



## Page 26

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  26
18. Definition of Done y checklists
18.1 Regla de oro
Una pantalla no esta "hecha" porque se ve bien.  Esta hecha cuando representa correctamente el dominio, 
muestra los estados relevantes, respeta permisos, conserva datos ante errores, funciona con teclado, responde en 
los breakpoints definidos, emite feedback y telemetria correctos, y sus acciones tienen pruebas.
18.2 DoD de especificacion
• No hay MUST requirement sin realizacion y acceptance test.
• No hay modulo sin actor/tarea/valor definido.
• No hay entidad critica sin ownership, integridad y lifecycle.
• No hay accion mutante sin permission + success/failure behavior.
• No hay flujo critico sin happy path, alternate path, exception y recovery.
• No hay screen contract sin responsive y state coverage aplicable.
• No hay datos sensibles sin politica de exposure/logging/retention.
• No hay supuesto de alto impacto oculto: esta marcado y tiene owner.
18.3 DoD visual
• Design tokens usados; no hay valores arbitrarios repetidos sin motivo.
• Componentes pertenecen a familia compatible; no hay Frankenstein visual.
• Jerarquia primaria/secundaria clara; tipografia y spacing consistentes.
• Light/dark si estan en scope; status colors y data-viz verificados.
• Desktop/tablet/mobile segun contract; no overflow ni controles inaccesibles.
• Loading/empty/error/no-results/permission/conflict renderizados y revisados.
• Focus, hover, active, disabled y selected states existen donde aplican.
• Screenshots locales de QA archivados con version/build, no previews scrapeados.
18.4 DoD production readiness
• Auth/authz server-side; secrets fuera del cliente/repo.
• DB migrations versionadas; backup/restore strategy probada cuando aplica.
• Observability y alerting para operaciones criticas.
• Runbook de fallos y third-party outages relevantes.
• Feature flags/rollout plan si el riesgo lo amerita.
• Security checks, dependency review y ASVS target acordado.
• Accessibility checks completados y findings criticos cerrados.
• Performance targets medidos con datos representativos.
• Support/admin surfaces disponibles para operar el producto.
• Changelog/release notes y migration notes cuando apliquen.



## Page 27

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  27
19. Roadmap de implementacion de la capa
19.1 Fase 0 - Foundation (1 repositorio)
• Crear schemas para REQ/MOD/FLOW/SCR/STA/EVT/PERM/ENT/TST.
• Implementar linter de referencias y coverage matrix.
• Crear plugin Antigravity con Orchestrator + 5 agentes base.
• Instalar skills oficiales de 21st y configurar MCP/CLI de forma autorizada.
• Crear design token template y baseline WCAG/OWASP.
• Crear browser screenshot harness local por viewport.
19.2 Fase 1 - Product intelligence
• Domain Research Agent + evidence store.
• Intake/confidence ledger.
• Capability/module generator con traceability.
• Permission matrix + data model generator.
• Experience Contract generator y validators.
19.3 Fase 2 - Visual intelligence
• Private library schema.
• 21st Scout oficial con queries por recipe.
• Local component sandbox + screenshot generator.
• Visual Inspector + family compatibility metadata.
• Composer que produce Screen Recipes.
19.4 Fase 3 - Verification
• Automated visual regression.
• Accessibility automation + keyboard scripts + manual checkpoints.
• Contract/E2E generation desde Event Contracts.
• Security checklist mapping a ASVS.
• Observability contract validation.
19.5 Fase 4 - Learning loop
• Promocion automatizada asistida de componentes aprobados.
• Registro de failures y reparaciones por patron.
• Metricas: acceptance rate de candidatos, loops hasta pass, defect escape rate, component reuse, spec coverage.
• Domain packs versionados: finance, CRM, ERP, e-commerce, real estate, etc.
19.6 Metricas de exito de PXIL
Metrica
Interpretacion
Spec coverage
% MUST requirements con realizacion + test.
State coverage
% screens/flows con estados aplicables modelados.



## Page 28

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  28
First-pass visual acceptance
% pantallas que pasan Visual QA sin rework mayor.
Component reuse
% UI proveniente de library aprobada vs custom one-off.
Candidate efficiency
candidatos revisados antes de adopcion; evitar 1st-result bias.
A11y defect escape
findings a11y encontrados despues de gate.
Production defect escape
bugs atribuibles a requisito/estado no especificado.
Design drift
violaciones de tokens/patrones por release.
Traceability integrity
referencias rotas u objetos huerfanos.
Cycle time
brief-ready -> production-ready, segmentado por gate.
20. Curriculum y herramientas recomendadas
20.1 Curriculum de la capa
Orden
Recurso
Que internalizar
1
ISO 9241-210 / Design Council Double 
Diamond [S11,S23]
Contexto, investigacion, 
divergencia/convergencia, iteracion.
2
ISO 29148 + 42010 [S14,S18]
Requisitos y viewpoints/architecture 
description.
3
ISO 25010/25019/25012 [S15-S17]
Calidad de producto, uso y datos.
4
Nielsen + ISO 9241-110/112 [S12,S13,S21]
Interaccion, feedback, percepcion, 
expectativas.
5
WCAG 2.2 + WAI-ARIA APG [S19,S20]
Accesibilidad y widgets.
6
Figma Introduction to Design Systems [S22]
Tokens, variables, components, libraries, 
governance.
7
OWASP ASVS/WSTG + NIST SSDF 
[S24,S26,S40]
Security requirements y verification.
8
NIST 800-63-4/RBAC/Privacy [S27,S28,S37]
Identity, permissions, privacy risk.
9
OpenAPI/RFC9457/OpenTelemetry [S29-
S31]
Contracts, errors, observability.
10
Microsoft relational DB learning [S35]
Normalization, constraints, indexes.
11
ISTQB Foundation [S36]
Test levels/types y acceptance.
12
21st + Antigravity official docs [S02-S10]
Retrieval, library, agents, MCP, browser, 
skills.
20.2 Cursos utiles
• Figma - Introduction to Design Systems: curso oficial sobre auto-layout, libraries, components, typography, 
accessibility, variables y tokens. [S22]
• W3C WAI - Digital Accessibility Foundations: curso gratuito, 16-20 horas estimadas, con estandares y evaluacion de 
barreras. [S39]
• Google UX Design Professional Certificate: proceso UX de 
empathize/define/ideate/wireframes/prototypes/test/iterate; util como base metodologica, no como sustituto de 
research real. [S41]



## Page 29

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  29
• Microsoft Learn - relational data y performance-based database design: normalization, datatypes e indexes. [S35]
• OWASP Web Security Testing Guide: referencia practica para testing de seguridad web. [S40]
20.3 Toolchain sugerido
Categoria
Herramientas / enfoque
Component source
21st MCP/CLI oficial + private 21st library o registry interno.
Agent runtime
Antigravity plugin + skills + subagents + browser.
Design tokens
CSS variables / Style Dictionary compatible; Figma variables 
opcional.
Component lab
Storybook u otro sandbox local que renderice estados y viewports.
E2E
Playwright/Cypress; preferir scripts que capturen screenshot y 
keyboard flows.
Accessibility
axe-core/Playwright + manual keyboard + screen reader 
checkpoints.
Visual regression
Playwright snapshots, Chromatic/Argos/Percy o equivalente.
State modeling
XState/SCXML-inspired contracts o reducer/statechart propio.
Process modeling
BPMN/Mermaid/PlantUML para evidencia; no obligar tool unico.
API contracts
OpenAPI 3.1.1 + JSON Schema + RFC 9457.
Data
Relational DB + migration tool; ERD versionado.
Observability
OpenTelemetry + backend de eleccion.
Security
OWASP ASVS checklist; SAST/dependency/secret scanning del 
stack.
Spec validation
JSON Schema/YAML lint + custom traceability validator.
Evidence
Git-versioned markdown/yaml/json + local QA screenshots.
21. Master Agent Contract
Este bloque puede convertirse en la instruccion raiz del Orchestrator. No debe cargarse literalmente completo en cada 
agente; las secciones deben fragmentarse en skills y rules para carga progresiva. [S08,S10]
ROLE
You are PXIL Orchestrator. Your job is not to "make a pretty UI". Your job is to
turn a product request into a complete, traceable software experience contract,
then orchestrate implementation and independent verification.
NON-NEGOTIABLE ORDER
1. Understand scope and context.
2. Research domain when needed; separate expected capabilities from confirmed scope.
3. Build traceable requirements, actors, permissions, domain/data model and flows.
4. Build screen inventory, state matrix, event contracts and feedback rules.
5. Define design DNA and system tokens.
6. Reuse approved private components first; then use authorized 21st MCP/CLI search.
7. Inspect candidates; select compatible families, not isolated pretty pieces.
8. Produce screen recipes before implementation.
9. Implement against contracts.
10. Run independent functional, accessibility, visual, security and production gates.
11. Promote only verified artifacts to the private library.
HARD RULES
- Never hide a high-impact assumption.
- Never treat compile success as visual or UX success.



## Page 30

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  30
- Never expose an action in UI that server-side authorization does not enforce.
- Never define a mutating action without success, failure and audit/telemetry behavior.
- Never define a data screen without applicable loading/empty/error/permission states.
- Never store scraped 21st marketplace previews/metadata as a private training corpus.
- Never reuse third-party code without provenance/license review.
- Prefer semantic tokens and accessible native patterns.
- Every MUST requirement needs a realization path and acceptance test.
OUTPUT DISCIPLINE
All decisions live in versioned artifacts under /pxil. Chat is not the source of truth.
Use stable IDs. Validate references. Fail a gate when evidence is missing.
21.1 Invariantes recomendados para rules
• Always inspect existing /pxil artifacts before proposing new scope.
• Always search private library before 21st; search 21st before hand-writing commodity UI.
• Never let Visual Director alter business rules.
• Never let Frontend Builder invent permissions or entity states.
• Visual QA reports findings before editing; Accessibility QA is independent.
• Critical destructive operations require explicit consequence + authorization + audit + recovery policy.
• All dates, numbers, currency and language behavior follow locale/timezone contracts; W3C notes that localization 
covers formats beyond translation. [S38]
• Use OpenAPI/Problem Details conventions for HTTP contracts where applicable.
• Log enough for investigation but never log secrets/sensitive raw payloads.
21.2 Resultado esperado de una solicitud
Ante "quiero un sistema de X", la respuesta de PXIL no es un solo mockup. Es un paquete: assumptions/confidence 
ledger, capability map, scope, actors, permissions, domain model, flows, screen inventory, screen/state/event 
contracts, design DNA, component plan, implementation tasks, test matrix y production-readiness report. La UI final es 
la representacion ejecutable de ese paquete.
A. Fuentes y referencias
S01  21st Terms of Service (20 Jul 2026) - https://21st.dev/terms
S02  21st - MCP for UI: Letting an Agent Install Components, Not Invent Them - https://docs.21st.dev/blog/mcp-ui-components
S03  21st - Introducing Component Libraries - https://docs.21st.dev/blog/component-libraries
S04  21st.dev Agent Skills repository - https://github.com/21st-dev/skill
S05  21st - MCP Apps / interactive component previews - https://docs.21st.dev/blog/introducing-mcp-apps
S06  Google Antigravity - Agent capabilities - https://www.antigravity.google/docs/agent
S07  Google Antigravity - Browser overview / screenshots - https://www.antigravity.google/docs/browser
S08  Google Antigravity - Rules - https://antigravity.google/docs/rules/
S09  Google Antigravity - Plugins - https://antigravity.google/docs/plugins
S10  Google Antigravity - Workflows to Skills migration - https://www.antigravity.google/docs/migration/workflows-to-skills/
S11  ISO 9241-210:2019 Human-centred design - https://www.iso.org/standard/77520.html
S12  ISO 9241-110:2020 Interaction principles - https://www.iso.org/standard/75258.html
S13  ISO 9241-112:2025 Presentation of information - https://www.iso.org/standard/87518.html
S14  ISO/IEC/IEEE 29148:2018 Requirements engineering - https://committee.iso.org/standard/72089.html
S15  ISO/IEC 25010:2023 Product quality model - https://www.iso.org/standard/78176.html



## Page 31

PXIL  /  Product & Experience Intelligence Layer
PXIL  |  31
S16  ISO/IEC 25019:2023 Quality-in-use model - https://www.iso.org/standard/78177.html
S17  ISO/IEC 25012:2008 Data quality model - https://www.iso.org/standard/35736.html
S18  ISO/IEC/IEEE 42010:2022 Architecture description - https://www.iso.org/standard/74393.html
S19  W3C WCAG 2.2 - https://www.w3.org/TR/WCAG22/
S20  W3C WAI-ARIA Authoring Practices Guide - Patterns - https://www.w3.org/WAI/ARIA/apg/patterns/
S21  Nielsen Norman Group - 10 Usability Heuristics - https://www.nngroup.com/articles/ten-usability-heuristics/
S22  Figma Learn - Introduction to design systems - https://help.figma.com/hc/en-us/sections/14548397990423-Introduction-to-
design-systems
S23  Design Council - Double Diamond - https://www.designcouncil.org.uk/resources/the-double-diamond/
S24  OWASP Application Security Verification Standard 5.0 - https://github.com/OWASP/ASVS
S25  OWASP Logging Cheat Sheet - https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
S26  NIST SP 800-218 Secure Software Development Framework - https://csrc.nist.gov/pubs/sp/800/218/final
S27  NIST SP 800-63-4 Digital Identity Guidelines - https://csrc.nist.gov/pubs/sp/800/63/4/final
S28  NIST Role Based Access Control resources - https://csrc.nist.gov/projects/role-based-access-control
S29  OpenAPI Specification 3.1.1 - https://spec.openapis.org/oas/v3.1.1.html
S30  RFC 9457 - Problem Details for HTTP APIs - https://www.rfc-editor.org/rfc/rfc9457.html
S31  OpenTelemetry Documentation / Semantic Conventions - https://opentelemetry.io/docs/
S32  W3C SCXML 1.0 - https://www.w3.org/TR/scxml/
S33  OMG BPMN 2.0.2 - https://www.omg.org/spec/BPMN/
S34  W3C Internationalization - Localization vs Internationalization - https://www.w3.org/International/questions/qa-i18n
S35  Microsoft Learn - Relational database design / normalization - https://learn.microsoft.com/en-us/training/modules/explore-
performance-based-design/
S36  ISTQB Certified Tester Foundation Level syllabus v4.0.1 - https://istqb.org/certifications/certified-tester-foundation-level
S37  NIST Privacy Framework - https://www.nist.gov/privacy-framework/privacy-framework
S38  W3C Internationalization Quick Tips - https://www.w3.org/International/quicktips/
S39  W3C WAI Digital Accessibility Foundations course - https://www.w3.org/WAI/courses/foundations-course/
S40  OWASP Web Security Testing Guide - https://owasp.org/projects/web-security-testing-guide
S41  Google UX Design Professional Certificate - https://www.coursera.org/professional-certificates/google-ux-design
A.1 Nota metodologica
Se priorizaron fuentes primarias, estandares, documentacion oficial y material de organizaciones reconocidas. Algunas 
normas ISO son de pago; este documento usa sus abstracts publicos y las convierte en principios operativos sin 
reproducir contenido protegido. Las herramientas y condiciones de servicio pueden cambiar: antes de automatizar 
integraciones externas, revisar documentacion y Terms vigentes.
A.2 Conclusion
La idea viable no es "una IA que sabe 21st".  La idea viable es una capa de especificacion y verificacion que sabe 
construir software completo y usa 21st como una de sus fuentes visuales. Si PXIL domina dominio, requisitos, 
estados, permisos, datos, interaccion y QA, entonces 21st acelera el ultimo tramo sin degradar criterio. Esa 
combinacion es la que puede producir aplicaciones premium y completas de forma repetible.

