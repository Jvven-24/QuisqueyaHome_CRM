No pude guardar `.viltrum/crm-ux/D21-academy-opensource.md`: esta sesión tiene permisos de **solo lectura**, sin posibilidad de escalarlos. Dejo el expediente completo a continuación. No modifiqué archivos.

# D21 · Academy: alternativas open source

**Fecha de consulta:** 2026-10-03  
**Proyecto:** QuisqueyaHome CRM  
**Clasificación:** INVESTIGACIÓN · CRM/ERP · R3 · F2  
**Productor:** D21, Codex  
**Revisión pendiente:** D03 y D02; participación de D12 en licencia y seguridad.

## 1. Recomendación

**Recomiendo Moodle como primer candidato para una prueba técnica acotada**, operado como servicio separado y conectado al CRM mediante un adaptador propio. Puntaje provisional: **78/100**. El umbral D21 exige probar antes de decidir su adopción.

La ventaja es reutilizar cursos, actividades, evaluaciones, permisos educativos y seguimiento existentes. Moodle documenta PostgreSQL, servicios web, OAuth2/OIDC y LTI 1.3. La integración concreta con Supabase Auth y el RBAC de este CRM **no está verificada**.

No recomiendo desarrollar ahora un LMS sobre Payload o Strapi: resuelven la administración del contenido, pero dejan por construir intentos, calificación, reglas de aprobación y certificación.

**Alternativa para una segunda PoC:** Frappe Learning. Ofrece evaluaciones y certificados integrados, pero introduce otro stack y su compatibilidad efectiva con la infraestructura actual requiere comprobación.

La propuesta es investigación para una fase posterior. Las decisiones locales #41 y #42 mantienen congeladas las funciones nuevas durante la reestructuración.

## 2. Capacidad y criterios de aceptación

**Capacidad:** formar a brokers y asesores con cursos y lecciones, registrar progreso individual, evaluar conocimientos y emitir una constancia trazable de aprobación.

| Restricción | Criterio |
|---|---|
| Stack | Next.js 15, React 19, TypeScript, Supabase/PostgreSQL y Drizzle |
| Identidad | El CRM conserva la autoridad sobre usuarios y permisos comerciales |
| P1 | Ningún consumidor de aplicación depende de identificadores o modelos del proveedor |
| Datos | Solo identidad educativa mínima; no transferir contactos, KYC ni negocios |
| Evaluación | Aprobar depende de una regla comprobada en servidor |
| Certificación | Identificador, versión del programa, fecha y evidencia de aprobación |
| Operación | Servicio aislado, actualizable y recuperable sin afectar al CRM |
| Salida | Exportar contenido, matrículas, progreso, intentos y certificados |
| Licencia | Uso comercial permitido; obligaciones y complementos revisados por D12 |

**No verificado:** presupuesto aprobado, usuarios totales y concurrentes, recursos disponibles de la VPS, volumen de vídeo, necesidad contractual de SCORM, plazo y política de conservación de expedientes educativos.

## 3. Estado real de Academy

La inspección corresponde al código local disponible, sin verificar su equivalencia con un commit remoto ni con el servicio desplegado.

| Evidencia local | Resultado |
|---|---|
| `src/app/(crm)/academy/page.tsx` | Resuelve actor, comprueba permiso y consulta el repositorio |
| `src/app/(crm)/academy/vista.tsx` | Catálogo, búsqueda, filtros, progreso y checklists interactivos |
| `src/app/api/academy/*` | Listado y actualización del progreso del usuario autenticado |
| `src/application/academy/puertos.ts` | Existe `RepositorioAcademy`, independiente de infraestructura |
| `src/application/academy/casos-de-uso.ts` | Casos de uso actuales delegan al repositorio |
| `src/application/academy/consultas.ts` | Consulta contenidos y resumen |
| `src/infrastructure/db/repos/academy.ts` | Adaptador Drizzle con progreso por usuario |
| `src/infrastructure/db/schema.ts` | Contenidos, pasos y dos tablas de progreso |
| `src/application/academy/casos-de-uso.test.ts` | Cinco pruebas declaradas con doble en memoria; no ejecutadas |

**Brechas observadas:**

- `vista.tsx:390`: el icono de reproducción no tiene acción; `videoUrl` aparece en el tipo, pero no se consume en un reproductor.
- `vista.tsx:172`: completar contenido es una declaración manual.
- `repos/academy.ts:288`: la certificación deriva del número de contenidos completados. No encontré intentos de examen, umbral de aprobación ni expediente de certificado en el módulo inspeccionado.
- `vista.tsx:252`: promete sincronización al recuperar conexión. Los manejadores leídos hacen `fetch` y rollback; no encontré una cola persistente que respalde esa promesa.
- `repos/academy.ts:271–288`: el denominador cuenta contenidos activos y el numerador cuenta progresos completados sin unirlos a esos contenidos. **Inferencia:** desactivar contenidos podría distorsionar el resumen. No reproducido.
- Las escrituras comprobadas usan `academy:view` y toman `actor.userId`. D02 debe confirmar si ese permiso incluye declarar progreso propio.
- No observé auditoría en el adaptador de Academy. El alcance de una posible auditoría transversal **no está verificado**.

Estos puntos son insumos de alcance y revisión; no se corrigieron ni se declaran hallazgos cerrados.

`docs/contexto/arquitectura.md` todavía describe Academy como datos de muestra. El código inspeccionado ya contiene consultas reales. Esta diferencia documental queda pendiente para D22 después de revisión.

## 4. Búsqueda en cuatro frentes

| Frente | Resultado y límite |
|---|---|
| Ya existe en Viltrum | Academy ya aporta catálogo, progreso, checklists, puerto y adaptador. La búsqueda textual en `docs/` y `.viltrum/` no identificó otro LMS integrado; no acredita ausencia en todos los proyectos de Viltrum |
| Nativo del stack | PostgreSQL y la arquitectura actual resuelven persistencia y aislamiento; el navegador reproduce medios. No aportan por sí solos autoría educativa, exámenes ni certificación |
| Open source | Diez candidatos comparados abajo |
| SaaS/API | MoodleCloud y Frappe Cloud aparecen en fuentes oficiales. No se profundizó en precios porque el mandato solicita open source; tarifas y TCO contratado no verificados |

## 5. Evidencia de candidatos

Las estrellas son las cifras redondeadas mostradas por GitHub durante la consulta, **no una medición histórica exacta**. Las fechas de actividad corresponden a evidencia visible; una página indexada puede quedar detrás del HEAD real.

| Candidato y repositorio | Licencia observada | Estrellas | Actividad respaldada | Stack y encaje |
|---|---|---:|---|---|
| [Moodle](https://github.com/moodle/moodle) | GPLv3; declaración `or-later` pendiente de confirmar en la versión fijada | ≈7,5 mil | [Commit `818d2a8`, 2026-09-07](https://github.com/moodle/moodle/commits/main/) | PHP; PostgreSQL soportado. Servicio externo |
| [Open edX](https://github.com/openedx/openedx-platform) | AGPLv3 declarada | ≈8,2 mil, observación del scout | [Organización oficial: actividad 2026-10-02](https://github.com/openedx) | Python/Django, React; MySQL, MongoDB y otros servicios |
| [Canvas LMS](https://github.com/instructure/canvas-lms) | AGPLv3 declarada | **No verificado** | Actividad observada en abril de 2026; último commit real **no verificado** | Ruby/Rails, PostgreSQL, Redis y trabajadores |
| [Chamilo](https://github.com/chamilo/chamilo-lms) | GPLv3+ declarada | **No verificado** | [v3.0.1, 2026-09-19](https://github.com/chamilo/chamilo-lms/releases/tag/v3.0.1) | PHP, MySQL/MariaDB; introduce otra base |
| [ILIAS](https://github.com/ILIAS-eLearning/ILIAS) | GPLv3 declarada | **No verificado** | [v11.4, 2026-09-03](https://github.com/ILIAS-eLearning/ILIAS/releases/tag/v11.4) | PHP, MySQL/MariaDB |
| [Frappe Learning](https://github.com/frappe/lms) | [AGPLv3, archivo leído](https://raw.githubusercontent.com/frappe/lms/develop/license.txt) | ≈3,3 mil | [v2.64.0, 30 de septiembre; año no explicitado en la página](https://github.com/frappe/lms/releases) | Frappe/Python, Vue; despliegue propio. PostgreSQL para esta aplicación **no verificado** |
| [ClassroomIO](https://github.com/classroomio/classroomio) | [AGPLv3, archivo leído](https://raw.githubusercontent.com/classroomio/classroomio/main/LICENSE) | ≈1,7 mil | [Commit `be7b094`, 2026-09-04](https://github.com/classroomio/classroomio/commits/main/) | SvelteKit, Hono, PostgreSQL, Better Auth y Redis |
| [LearnHouse](https://github.com/learnhouse/learnhouse) | [AGPLv3, archivo leído](https://raw.githubusercontent.com/learnhouse/learnhouse/main/LICENSE); Enterprise separado | ≈2,3 mil | [Commit `fb51965`, 2026-07-27, versión 1.3.4](https://github.com/learnhouse/learnhouse/commits/main/) | Next/React, FastAPI/Python, PostgreSQL, Redis y colaboración |
| [Payload](https://github.com/payloadcms/payload) | [MIT, archivo leído](https://raw.githubusercontent.com/payloadcms/payload/main/LICENSE.md) | ≈45,1 mil | [Actividad de lanzamiento 2026-09-24](https://github.com/payloadcms/payload/releases) | CMS TypeScript/Next/React; PostgreSQL |
| [Strapi](https://github.com/strapi/strapi) | [MIT para núcleo; excepción Enterprise explícita](https://raw.githubusercontent.com/strapi/strapi/main/LICENSE) | ≈73,3 mil | [v5.56.0, 2026-09-30](https://github.com/strapi/strapi/releases) | CMS Node/TypeScript, administración React; PostgreSQL |

### Cobertura, integración y salida

| Opción | Cobertura y camino P1 | Operación y límite principal | Salida |
|---|---|---|---|
| Moodle | Cursos, actividades y evaluación; API de servicios web. Adaptador de matrícula y lectura de finalización | Coste medio estimado; PHP, tareas programadas y archivos. Certificado PDF exige evaluar complemento | Backup de curso documentado; portabilidad completa de intentos y certificados pendiente |
| Open edX | LMS y Studio amplios; integrar servicios educativos detrás del puerto | Coste alto inferido de sus múltiples servicios. El proyecto recomienda Tutor | Exporta contenido; el export de curso no incluye usuarios ni certificados |
| Canvas | LMS amplio, REST/OAuth2 y LTI | Coste alto estimado; Rails, Redis, trabajos y assets | Export/import de cursos; historial educativo completo pendiente |
| Chamilo | Cursos, rutas y SCORM; referencias a API | Coste medio estimado; PHP y MySQL/MariaDB adicionales | Exportación declarada; restauración completa pendiente |
| ILIAS | LMS amplio; mecanismo de integración específico pendiente | Coste medio/alto estimado; administración adicional | Exportación detallada **no verificada** |
| Frappe | Cursos, capítulos, quizzes, tareas y certificados | Coste medio estimado; otro framework y operación propia | Importación ZIP documentada; export completo del expediente pendiente |
| ClassroomIO | Cursos, ejercicios, grading y certificados; REST/webhooks declarados | Coste medio estimado. La identidad actual usa Better Auth | Exportación integral y reimportación **no verificadas** |
| LearnHouse | Cursos, actividades, API y certificados declarados | Coste medio estimado; SSO y SCORM están documentados dentro de Enterprise | Backup disponible; export neutral completo pendiente |
| Payload | Autoría, contenido, API y permisos del CMS | Operación inicial baja/media; desarrollar pedagogía propia aumenta mantenimiento | Exportar contenido por API; expediente educativo todavía habría que construirlo |
| Strapi | Autoría y API; adaptador de contenido | Operación media; misma brecha pedagógica que Payload | Herramientas de contenido; equivalencia de intentos/certificados no aplica sin construirlos |

Fuentes específicas: [servicios web de Moodle](https://docs.moodle.org/502/en/Using_web_services), [backup de Moodle](https://docs.moodle.org/501/en/Course_backup), [export de Open edX](https://docs.openedx.org/en/latest/educators/how-tos/releasing-course/export_course.html), [operación de Canvas](https://github.com/instructure/canvas-lms/wiki/Production-Start), [Frappe: primeras actividades](https://docs.frappe.io/learning/setup-guide/your-first-steps-with-frappe-learning), [API y arquitectura de ClassroomIO](https://github.com/classroomio/classroomio), [desarrolladores de LearnHouse](https://docs.learnhouse.app/developers).

**Advertencias verificadas:**

- ClassroomIO tiene documentación histórica sobre Supabase, pero su repositorio actual declara Better Auth. No asumir que reutiliza Supabase Auth.
- LearnHouse documenta SSO, audit logs y SCORM en Enterprise. No contabilizarlos como capacidades gratuitas del núcleo.
- Moodle LMS y Moodle Workplace tienen alcances distintos. Esta evaluación corresponde a LMS.
- Open edX recomienda un despliegue compuesto; compartir frontend React no reduce esa complejidad.
- No se identificó un producto inequívoco llamado simplemente “Classroom” o “Docebo-like OSS”. ClassroomIO cubre la alternativa concreta encontrada.

## 6. Licencias y seguridad

GPL y AGPL permiten actividad comercial bajo sus condiciones; no equivalen a autorización irrestricta para incorporar código en el CRM. Las licencias leídas contienen condiciones de modificación y redistribución. AGPL añade obligaciones para determinadas versiones modificadas accesibles por red. [GPL de Moodle](https://raw.githubusercontent.com/moodle/moodle/main/COPYING.txt), [AGPL de Frappe](https://raw.githubusercontent.com/frappe/lms/develop/license.txt).

**Propuesta:** integrar por protocolo como servicio separado, conservar avisos y procedencia, y evitar portar código hasta revisión de D12. La separación por API no constituye por sí sola una conclusión jurídica sobre todos los escenarios.

No se ejecutaron scanners ni se resolvieron todas las dependencias de una versión fijada. **Ningún candidato queda certificado como seguro.** Antes de integrar deben revisarse advisories, plugins, imágenes y obligaciones de cada componente.

Se observaron ejemplos públicos de configuración/credenciales en resultados y documentación externa. Se detuvieron las consultas a esas fuentes; los valores se omiten. **No se verificó que fueran secretos activos.** No se leyeron archivos `.env`, cadenas de conexión ni inventarios de variables.

## 7. Puntuación D21

Puntos asignados dentro del peso máximo de cada criterio. Son **juicios comparativos provisionales**, no resultados de pruebas. Seguridad e integración reciben penalización por falta de ejecución.

| Opción | Cobertura /20 | Licencia /15 | Mant. /15 | Seguridad /15 | Integración /10 | Salida /10 | TCO /10 | UX /5 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Moodle | 18 | 13 | 14 | 8 | 7 | 8 | 7 | 3 | **78** |
| Frappe | 19 | 11 | 13 | 7 | 6 | 7 | 6 | 4 | **73** |
| Payload | 8 | 15 | 14 | 8 | 9 | 8 | 5 | 4 | **71** |
| ClassroomIO | 19 | 11 | 10 | 6 | 7 | 6 | 7 | 4 | **70** |
| Chamilo | 18 | 13 | 12 | 7 | 5 | 6 | 6 | 3 | **70** |
| Open edX | 19 | 11 | 14 | 8 | 5 | 6 | 2 | 3 | **68** |
| ILIAS | 18 | 13 | 12 | 7 | 4 | 6 | 5 | 3 | **68** |
| Canvas | 18 | 11 | 11 | 8 | 6 | 7 | 3 | 3 | **67** |
| LearnHouse | 18 | 8 | 11 | 6 | 7 | 6 | 6 | 4 | **66** |
| Strapi | 8 | 13 | 14 | 8 | 8 | 8 | 4 | 3 | **66** |

**Razones del orden:**

- Moodle combina mantenimiento observado, PostgreSQL y protocolos documentados; penaliza integración de identidad y complemento de certificación pendiente.
- Frappe cubre bien formación y certificados; penaliza introducir otro stack.
- ClassroomIO ofrece un alcance cercano al entrenamiento empresarial, pero identidad, exportación y estabilidad del contrato requieren comprobación.
- LearnHouse se acerca al frontend actual, pero las funciones Enterprise afectan al requisito open source.
- Open edX y Canvas penalizan operación para una Academy interna cuyo volumen aún se desconoce.
- Chamilo e ILIAS requieren validar API, identidad y otra base de datos.
- Payload y Strapi puntúan bien como infraestructura de contenido, pero **fallan el criterio funcional de adoptar un LMS completo**. Su total no elimina esa brecha.

Todos los candidatos quedan en el intervalo de PoC. Para contener el coste, se propone probar primero Moodle y abrir una segunda prueba únicamente si falla un criterio obligatorio.

**Estrategia propuesta: E1, integrar el módulo completo**, condicionada a demostrar cobertura suficiente. No se propone E2: portar piezas arrastraría mantenimiento propio y obligaciones de licencia sin evidencia de ahorro.

## 8. Estándares y componentes React

### Estándares

| Estándar | Utilidad | Decisión propuesta |
|---|---|---|
| SCORM 1.2 | Contenido empaquetado con comunicación de progreso y resultado | Admitirlo si existe contenido comprado o heredado que lo necesita |
| SCORM 2004 | Añade reglas de secuenciación y navegación | Requisito separado: Moodle declara que no lo soporta plenamente de forma nativa |
| xAPI | Comunicación de experiencias educativas con un LRS | Posponer hasta tener una necesidad de seguimiento entre sistemas |
| cmi5 | Define importación, lanzamiento y seguimiento usando xAPI | Evaluarlo junto con LRS y contenido compatible; no equivale a añadir un reproductor |
| LTI 1.3 | Lanzamiento e interoperabilidad entre plataforma y herramienta con OIDC/JWT/OAuth2 | Alternativa para abrir el LMS desde el CRM; exige implementar y verificar el papel del CRM |

Fuentes: [SCORM en Moodle](https://docs.moodle.org/501/en/SCORM_FAQ), [xAPI oficial](https://github.com/adlnet/xAPI-Spec), [cmi5 oficial](https://github.com/AICC/CMI-5_Spec_Current), [guía ADL cmi5](https://www.adlnet.gov/assets/uploads/cmi5%20Best%20Practices%20Guide%20-%20From%20Conception%20to%20Conformance.pdf), [LTI 1.3](https://www.imsglobal.org/spec/lti/v1p3/), [Moodle como herramienta LTI](https://docs.moodle.org/501/en/Publish_as_LTI_tool).

La compatibilidad certificada de cada versión y la interoperabilidad entre contenidos concretos **no están verificadas**.

### Bibliotecas

Evaluación orientativa de **encaje para su pieza**, escala 1–5; no comparable con el total de un LMS.

| Componente | Evidencia | Encaje | Límite |
|---|---|---:|---|
| [ReactPlayer](https://github.com/cookpete/react-player) | [MIT](https://raw.githubusercontent.com/cookpete/react-player/master/LICENSE.md), ≈10,3 mil estrellas | **4/5** | Reproduce medios; no aporta curso, matrícula ni aprobación. Último commit y compatibilidad exacta React 19 no verificados |
| [react-quiz-component](https://github.com/wingkwong/react-quiz-component) | [MIT](https://raw.githubusercontent.com/wingkwong/react-quiz-component/master/LICENSE), 402 estrellas | **3/5** | Quizzes JSON y callbacks. La nota del cliente no debe autorizar certificados. Actividad reciente y React 19 no verificados |
| [scorm-again](https://github.com/jcputney/scorm-again) | MIT declarada, runtime SCORM 1.2/2004 y ejemplos de integración React | **3/5** | No verifica ni importa paquetes. Requiere almacenamiento, backend e aislamiento propios. Estrellas y fecha exacta de actividad no verificadas |

ReactPlayer documenta cambios incompatibles entre v2 y v3. `scorm-again` presenta capacidades offline y también una advertencia de desarrollo en curso; no se toma el README como prueba de funcionamiento.

Para Moodle se propone reutilizar inicialmente su reproductor y actividades. Estas bibliotecas quedan como alternativas para una experiencia propia posterior.

## 9. Contrato P1 propuesto

Propuesta conceptual para D03, **sin implementación**:

```text
Vista Academy
    → Casos de uso y autorización del CRM
    → Puerto educativo propio
    → Adaptador del LMS
    → API / lanzamiento del proveedor
```

El puerto actual sirve para el catálogo y progreso manual. Las capacidades de un LMS requieren distinguir:

| Operación conceptual | Condición |
|---|---|
| Consultar catálogo | Solo programas visibles y versiones publicadas |
| Matricular / suspender | Idempotencia e identidad educativa vinculada al actor |
| Crear lanzamiento | Recurso permitido, audiencia y expiración limitadas |
| Consultar expediente | Progreso, nota y aprobación como campos diferentes |
| Obtener certificado | Identificador, versión, fecha y estado verificable |
| Exportar expediente | Formato neutral y versión del esquema |

**Autoridades propuestas:**

- CRM: actor, acceso comercial, asignación del programa y checklists operativos.
- LMS: contenido educativo, intentos, evaluación y evidencia de finalización.
- CRM: proyección de lectura del expediente, con origen y fecha de sincronización.

El porcentaje manual existente se conserva como **autodeclaración histórica**; no se convierte automáticamente en un examen aprobado.

El adaptador traduce identificadores y errores. URLs y modelos del proveedor no deben propagarse al dominio. No compartir tablas ni permitir que el LMS gestione el esquema del CRM.

Para Moodle se comprobó documentalmente una función de consulta de finalización y el patrón de matrícula con validación de contexto/capacidad. La finalización **no sustituye a la nota**. [Código oficial de completion](https://github.com/moodle/moodle/blob/main/completion/classes/external.php), [matrícula manual](https://github.com/moodle/moodle/blob/main/enrol/manual/externallib.php).

**Identidad:** Moodle admite OIDC, pero Supabase Auth como emisor compatible en esta instalación está **no verificado**. D03 debe comparar OIDC y LTI antes de elegir. No se propone transferir contraseñas ni reutilizar cookies del CRM. [OIDC en Moodle](https://docs.moodle.org/501/en/OAuth_2_services).

## 10. PoC y adopción por fases

### Fase 0 · Alcance y procedencia

D02 confirma usuarios, obligatoriedad de exámenes, nota mínima, reintentos, vigencia de certificados y necesidad de estándares. D03/D12 fijan versión soportada, complemento de certificados y licencias.

Moodle documenta PostgreSQL 15 como mínimo para la versión 5.1; la versión real de la base disponible **no se comprobó**. No se propone desplegar `main`. [Requisitos oficiales](https://moodledev.io/general/releases/5.1).

### Fase 1 · PoC aislada

**Caja propuesta:** tres jornadas técnicas, máximo 24 horas. No ejecutada.

Entorno separado, datos sintéticos, sin conexión a producción y con puerto reservado por D16 dentro del bloque `9300–9399`. Disponibilidad concreta **no verificada**.

| Prueba | Éxito exigido |
|---|---|
| Identidad | Entrar desde el CRM sin compartir contraseñas; impedir suplantación |
| Aislamiento | Broker A no consulta expediente de B por UI ni API |
| Baja de usuario | Suspensión efectiva tanto en entrada CRM como LMS |
| Aprendizaje | Dos lecciones, quiz fallido y quiz aprobado persistidos |
| Certificación | Solo se emite tras aprobación; referencia verificable |
| Repetición | Reintentar matrícula/sincronización no duplica datos |
| Salida | Exportar y restaurar curso; conservar expediente educativo neutral |
| Recuperación | Restaurar base y archivos en instancia nueva |
| UX | Carga, vacío, error, offline, éxito y permiso insuficiente |
| Operación | Medir recursos y latencia; límites aceptados previamente por D03/D16 |

El informe reproducible debe registrar versiones, imágenes, configuración no secreta, comandos, resultados y capturas. Las credenciales se leen del entorno en ejecución y se excluyen de logs.

**Fallo obligatorio:** ausencia de salida completa, acceso cruzado, certificación basada en una nota manipulable o necesidad de rediseñar ampliamente el proveedor.

### Fase 2 · Piloto autorizado

Un programa y grupo pequeño. Academy muestra catálogo y expediente; el aprendizaje abre en el LMS. Se preservan los checklists actuales y la historia previa.

### Fase 3 · Integración definitiva

Tras revisión independiente: sincronización con idempotencia, observabilidad, respaldo, procedimiento de actualización y regresión. Una experiencia totalmente embebida se considera después de medir el piloto.

## 11. Coste a tres años

**Estimación de escenario, no cotización ni coste medido.** Supuestos explícitos:

- Integración y puesta en marcha: 48–96 horas.
- Mantenimiento: 36–72 horas por año.
- Tarifa ilustrativa: US$30/h.
- Infraestructura incremental y respaldo: US$25–50/mes.
- Sin desarrollo de contenido, migración masiva, vídeo intensivo ni soporte comercial.
- Licencia del núcleo OSS: sin tarifa; complementos y revisión legal pendientes.

| Concepto | Año 1 | Año 2 | Año 3 |
|---|---:|---:|---:|
| Integración inicial | US$1.440–2.880 | — | — |
| Operación y respaldo | US$300–600 | US$300–600 | US$300–600 |
| Mantenimiento | US$1.080–2.160 | US$1.080–2.160 | US$1.080–2.160 |
| **Total anual** | **US$2.820–5.640** | **US$1.380–2.760** | **US$1.380–2.760** |

**Total ilustrativo:** US$5.580–11.160. Reserva de salida propuesta: 24–48 horas, US$720–1.440 adicionales bajo la misma tarifa.

TCO monetario de otros candidatos **no verificado**. La penalización comparativa responde a servicios adicionales y trabajo propio esperado, sin fingir un benchmark de RAM o coste de Hostinger.

## 12. Plan de salida

Desde el piloto se exige conservar:

- Contenido fuente y medios originales con permisos de uso.
- Backup nativo del curso.
- Export neutral versionado de matrículas, progreso, intentos, notas, aprobación y certificados.
- Mapeo entre identidad CRM e identidad educativa.
- Versión del programa y regla de aprobación aplicable a cada expediente.

El backup Moodle facilita restaurar Moodle; **no garantiza migración semántica a otro LMS**. La PoC debe comprobar ambos tipos de salida.

**Alternativa:** Frappe o el repositorio Academy existente para consulta histórica, tras comprobar cobertura. Estimación inicial de salida: 24–48 horas para un piloto pequeño; volumen real **no verificado**.

**Activadores:** actualización imposible, requisito esencial ligado a licencia incompatible, incidente sin corrección aceptable o incumplimiento repetido del contrato.

## 13. Riesgos y pendientes

| Riesgo | Mitigación y responsable |
|---|---|
| SSO incompatible | PoC de identidad antes del piloto — D03/D19 |
| Permisos divergentes | Pruebas de acceso cruzado y suspensión — D12/D14 |
| Certificado sin evidencia | Aprobación en servidor y regla versionada — D02/D03 |
| Plugin de certificado incompatible | Fijar versión, licencia, API y export — D12/D03 |
| Paquete educativo ejecuta contenido activo | Origen separado y revisión de importación/aislamiento — D12 |
| Export incompleto | Ensayo obligatorio de restauración y migración — D11 |
| Carga afecta al CRM | Recursos aislados y medición — D16/D15 |
| Documentación local desactualizada | Reconciliar tras revisión — D22 |
| Fuentes indexadas desfasadas | Revalidar versión, licencia y advisories al fijar candidato — D21/D12 |

No ejecuté `git`, `gh`, instalación, servidor, build, pruebas ni cambios de configuración. La evidencia es inspección documental y de código; **no acredita aceptación, despliegue ni funcionamiento integrado**.

## Handoff

**D03 — revisión técnica independiente**

- Revisar Moodle como candidato de PoC, puntaje provisional 78/100.
- Decidir contrato, identidad, separación de datos y mecanismo de sincronización.
- Confirmar PostgreSQL disponible y compatibilidad del complemento de certificados.
- Rechazar la propuesta si requiere modificar consumidores por detalles del proveedor o si no puede exportar el expediente completo.

**D02 — alcance**

- Confirmar volumen, presupuesto, evaluación obligatoria, reintentos, vigencia y significado empresarial de “certificado”.
- Decidir si basta abrir el LMS desde Academy o se requiere experiencia embebida.
- Confirmar necesidad de SCORM 2004, xAPI/cmi5 o LTI.
- Ubicar cualquier integración después del milestone vigente.

**D12 — licencia y seguridad**

Revisar versiones fijadas, complementos, dependencias, aislamiento, acceso directo al LMS y minimización de datos antes de E1.

**Estado:** análisis producido; PoC, revisión y decisión pendientes. D21 no aprueba su propio trabajo ni declara ningún gate superado.

**Bloqueo de entrega:** el expediente no quedó persistido en `.viltrum/crm-ux/D21-academy-opensource.md` porque el host impone lectura exclusiva. Debe guardarse mediante una sesión autorizada para escribir ese único entregable.