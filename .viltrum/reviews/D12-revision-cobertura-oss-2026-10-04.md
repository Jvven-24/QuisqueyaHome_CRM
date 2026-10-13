# D12 · Revisión independiente del estudio funcional y OSS

Fecha: 2026-10-04 (America/Santo_Domingo). Revisor: D12, sesión independiente de los productores D21 y D03. Estado: **observaciones abiertas; sin aprobación de gate ni de alcance**. Riesgo del proyecto: R3.

## Insumos y comprobaciones

- `.viltrum/commercial.md` (C1 M01–M15), `.viltrum/vre-os/spec/00-indice.md`, `.viltrum/vre-os/MAPA-SISTEMAS-OSS.md`, `.viltrum/vre-os/spec/modulos/M03-negocios.md` y el Blueprint maestro local.
- D21: catálogo funcional, cobertura OSS CRM, cobertura transversal, alternativas de motor y capacidades transversales del 4 de octubre. D03: arquitectura multi-OSS y cobertura de la misma fecha.
- Lectura CSV con `python csv.DictReader`: 135 claves distintas en catálogo, 61 marcadas `contractual` y 74 `aspiracional`. CSV motor: 85 filas; CSV transversal: 50. Unión exacta de 135 claves, sin claves duplicadas ni ausentes. Esa comprobación es **solo de claves**, no de granularidad, licencia, API, integración ni aceptación de C1.
- Fuentes primarias consultadas: [README de Cal.diy](https://github.com/calcom/cal.diy), [licencia de Cal.diy](https://github.com/calcom/cal.diy/blob/main/LICENSE), [licencia de Twenty](https://github.com/twentyhq/twenty/blob/main/LICENSE). No se instaló ningún producto ni se ejecutaron llamadas de contrato contra servicios de terceros.

## Hallazgos

### P1 · D12-OSS-01 · Identidad y aptitud de Cal.diy confundidas con Cal.com

**Evidencia:** `D21-cobertura-oss-crm-2026-10-04.csv`, fila `agenda.public_booking`, ya nombra Cal.diy, y `D21-capacidades-oss-transversales-2026-10-04.md` filas 26–27 distingue el fork. Sin embargo, `D03-arquitectura-multi-oss-cobertura-2026-10-04.md` tabla de citas, `.viltrum/vre-os/MAPA-SISTEMAS-OSS.md` §§1, 3, 6 y 7 aún nombran Cal.com como componente OSS/RUN. El README oficial de Cal.diy declara MIT y ausencia de funciones Enterprise, pero **recomienda estrictamente uso personal no productivo**; equipos, organizaciones, workflows y SSO fueron retirados. La licencia MIT no prohíbe uso comercial por sí misma; el bloqueo aquí es de soporte, seguridad y paridad funcional sin prueba.

**Riesgo:** seleccionar un producto/API equivocado y contar reserva pública como capacidad lista para un CRM comercial. **Cierre:** D21/D03 sustituyen la identidad en mapa/arquitectura, fijan commit y versión, enumeran funciones excluidas y prueban slots, booking, cancelación, conflicto, privacidad e identidad contra instancia Cal.diy; D02 decide si la reserva pública permanece aspiracional.

### P1 · D12-OSS-02 · Cobertura documental confundida con API utilizable

**Evidencia:** `D21-cobertura-transversal-vre-2026-10-04.csv`: `academy.catalog`/`academy.progress` se marcan `si` con un roadmap general de Moodle; `message.inbox` se marca `si` citando guía de inbox Chatwoot; `academy.certificate` elige Frappe Learning mientras el flujo D03 y las demás filas Academy seleccionan Moodle. `message.whatsapp_send`, `message.template` y `voice.whatsapp_ingest` atribuyen al runtime propio un enlace documental de Chatwoot que no acredita la API del runtime. `document.signature` cita Papermark sin candidato ni función de firma verificados.

**Riesgo:** sumar como potencial OSS acciones que solo están en UI, en otro producto o en edición distinta. **Cierre:** para cada fila, registrar versión/edición, operación o endpoint exacto, permiso requerido y prueba positiva/negativa con identidad limitada; cambiar `si` a `desconocido` cuando la fuente solo demuestra capacidad de UI. Resolver el proveedor único de Academy o documentar la federación de identidad y la razón de dos LMS.

### P1 · D12-OSS-03 · Identidad, autorización y PII entre servicios sin contrato verificable

**Evidencia:** D03 reconoce que correo no es identidad y propone `IdentidadPort`, provisión/revocación y BFF, pero los CSV no registran por función actor/rol, datos transmitidos, base/finalidad, residencia, retención, borrado, respuesta a revocación ni cuenta/tenant de proveedor. Esto afecta en especial `academy.progress`, `message.inbox`, `agenda.public_booking`, `clientroom.documents`, `document.read_track` y el espejo Twenty.

**Riesgo:** un token de servicio puede exponer datos entre brokers; la correlación por email/teléfono o un webhook no autenticado puede unir clientes distintos. **Cierre:** D03/D11/D12 definen matriz de ID local ↔ externo, scopes y pruebas negativas por rol/tenant, payload mínimo, consentimiento/finalidad, retención y borrado por proveedor. Los eventos y webhooks requieren autenticidad, deduplicación, orden y reconciliación. No conectar datos reales antes de estas pruebas.

### P1 · D12-OSS-04 · Denominador contractual aún provisional

**Evidencia:** D03 §“UX unificada y cálculo de cobertura” reconoce que 61/74/135 son inventario inicial y prohíbe publicarlos como medidos antes de validar granularidad. Las filas `report.export_csv` y `export.csv` parecen solaparse; `trash.purge_policy` figura `contractual` con origen `C1:M15`, aunque C1 promete papelera segura y recuperación, no purga. `agenda.public_booking` y `document.signature` son aspiracionales; mantenerlos separados del C1. C1 M03 habla de **seis** etapas, mientras `spec/modulos/M03-negocios.md` §§5 y CA-02 exige **siete** del catálogo. La discrepancia cambia criterios de aceptación.

**Riesgo:** porcentaje con denominador inflado/reducido a voluntad o aparente cumplimiento contractual sin decisión de alcance. **Cierre:** D02 y aprobador validan cada fila contractual y su criterio atómico; fusionan o justifican solapamientos, resuelven seis/siete etapas y versionan el catálogo. Hasta entonces, usar `61/74/135` solo como tamaño de inventario, jamás como porcentaje de producto entregado.

### P2 · D12-OSS-05 · SuiteCRM se presenta como “mejor candidato” antes de la PoC

**Evidencia:** `D21-cobertura-oss-crm-2026-10-04.csv` asigna SuiteCRM 8 a once acciones de leads/contactos mientras D03 §§“Decisión vigente” y “PoC local” lo mantiene como sustituto **condicional** de Twenty. Las filas citan el mismo índice general de API v8, sin operación exacta, edición fijada ni prueba local de extensión/permisos.

**Riesgo:** una matriz de candidatos puede leerse como selección arquitectónica o cobertura implementada. **Cierre:** renombrar el campo como candidato hipotético y exigir prueba Twenty primero; para SuiteCRM, mapear endpoint, autenticación/rol, metadatos y resultado por acción antes de compararlo.

### P2 · D12-OSS-06 · Licencia OSS no implica función libre ni operable

**Evidencia:** D21 distingue correctamente Activepieces embedding/SSO Enterprise, Schedule-X plugins Premium, GoRules diseñador comercial y Papermark `ee/` sin atribuirlos al núcleo. Sin embargo, `MAPA-SISTEMAS-OSS.md` aún agrupa Cal.com con bibliotecas MIT/BSD “según API GitHub; LICENSE sin leer”, y las filas Papermark del estudio no fijan qué capacidades están en self-host OSS. Twenty tiene licencia AGPLv3 con excepción de aplicaciones por API y archivos Enterprise; esto depende de la versión concreta desplegada.

**Riesgo:** contar una función de edición comercial como cobertura OSS o copiar código sujeto a licencia distinta. **Cierre:** fijar SHA/digest por candidato, leer LICENSE y marcas de archivo de esa versión, separar API pública, núcleo OSS y función comercial; solicitar revisión legal humana cuando haya dudas de términos. La revisión D12 es técnica, no dictamen jurídico.

### P2 · D12-OSS-07 · Estado local y porcentaje de entrega sin evidencia vertical

**Evidencia:** catálogo D21 marca 70 `parcial`, 51 `ausente`, 14 `desconocido`; el CSV de motor llama `api_documentada` a nueve filas. Ninguna categoría prueba la cadena UI → BFF → política → puerto → proveedor → datos → fallos. D03 sí especifica que solo `integrada y probada` entra al numerador, pero los CSV no tienen columna de ese estado ni evidencia de prueba positiva/negativa, commit y versión.

**Riesgo:** inferir avance de la disponibilidad documental del proveedor. **Cierre:** incorporar matriz de pruebas verticales y estados de D03 por clave; reportar por separado C1, aspiracional y potencial OSS. Mantener numerador de entrega en “no medido” hasta evaluación verificable.

## Dictamen y siguiente revisión

El estudio sirve como inventario de investigación; **no acredita cobertura implementada ni autoriza incorporar proveedores nuevos con datos reales**. D21/D03 deben corregir identidad Cal.diy, procedencia de API/licencia, granularidad C1 y matriz de identidad/PII. D14 deberá comprobar las pruebas técnicas y D02/cliente resolver alcance; revisión humana requerida para riesgos legales o de producción. D12 no registra aprobación de gate ni se autoaprueba.

## Revisión de correcciones · segunda pasada del 4 de octubre

**Nuevos insumos:** `D21-cobertura-transversal-vre-2026-10-04.csv` y `D21-cobertura-oss-crm-2026-10-04.csv` corregidos, `D21-sintesis-cobertura-integral-2026-10-04.md`, `D21-brechas-inventario-vre-2026-10-04.md`, `D03-arquitectura-multi-oss-cobertura-2026-10-04.md` revisado y `D02-alcance-funcional-integral-2026-10-04.md` (propuesta de alcance, no aceptación humana). Esta pasada verifica texto y consistencia de inventario; no ejecuta PoC, tests E2E, escáner ni revisión legal.

**Métricas reproducidas con `csv.DictReader` y extracción de filas del anexo:** catálogo 135 claves únicas = 61 etiquetadas C1 + 74 aspiracionales; 70 `parcial`, 51 `ausente`, 14 `desconocido`. Matriz sectorial 85 claves (44 C1, 41 aspiracionales): 8 `api_documentada`, 17 `extension`, 54 `propio`, 6 `desconocido`. Matriz transversal 50 (17 C1, 33 aspiracionales): 8 `si`, 13 `parcial`, 23 `no`, 6 `desconocido`. La unión de matrices tiene las 135 claves exactas sin duplicados. Anexo: 32 propuestas únicas que no pisan claves del catálogo = 2 etiquetadas contractuales, 21 aspiracionales, 9 desconocidas. **167 = 135 + 32 es techo de exploración sin depurar, no denominador aprobado**. Las taxonomías sectorial y transversal no se suman como porcentaje homogéneo. La síntesis D21 reporta cero filas con prueba E2E consignada en estas matrices y deja el numerador real *no medido*; ello no significa cero funciones locales operativas.

| Hallazgo | Estado tras corrección | Evidencia y pendiente |
|---|---|---|
| **D12-OSS-01 Cal.diy/Cal.com** | **Parcialmente mitigado; P1 abierto** | La fila `agenda.public_booking` ya dice `Cal.diy (candidato condicional)`, grado `desconocido`, sin paridad de API ni aptitud productiva asumidas. D03 y síntesis D21 también lo distinguen. Pero `.viltrum/vre-os/MAPA-SISTEMAS-OSS.md` §§1, 2, 3, 6, 7 y 9 conserva Cal.com como RUN/MIT y plantea VPS; es una fuente desactualizada que debe reconciliarse o marcarse histórica antes de seleccionar proveedor. PoC local y revisión de operación siguen pendientes. |
| **D12-OSS-02 UI/documentación frente a API** | **Parcialmente mitigado; P1 abierto** | `academy.catalog` y `academy.progress` bajaron de `si` a `parcial`; `academy.certificate` ya apunta a Moodle con plugin y `parcial`; `message.inbox` bajó a `parcial`; la fuente para runtime propio ya es el mapa local y marca `desconocido`. Aún `academy.quiz` figura `si` basado en un PDF de funciones para alumnos, no en endpoint/permiso probado; `document.signature` sigue sin candidato; ningún proveedor tiene prueba vertical UI/BFF/API/rol/errores. Además, API local del runtime propio y plugin certificado/versiones siguen sin verificar. |
| **D12-OSS-04 denominador C1** | **Abierto, bien delimitado; P1** | D21 deja 135 como inventario y suma 32 solo como anexo. D02 clasifica 2 derivaciones M10, 21 propuestas y 9 definiciones abiertas, y advierte que C1 aprueba módulos, no filas. Siguen sin decisión humana: `report.export_csv`/`export.csv`, `trash.purge_policy`, WhatsApp API frente a `wa.me`, alcance RFC 5545, matrícula/intentos y seis frente a siete etapas. No publicar 61 como cobertura contractual aprobada ni 167 como avance. |
| **D12-OSS-05 SuiteCRM** | **Riesgo de selección documental resuelto; verificación técnica pendiente, P2** | Las once filas ahora dicen `SuiteCRM 8 (alternativa condicional)` y su `gap_ui_quisqueya` inicia «Solo alternativa si Twenty falla PoC; no seleccionado». D03 y la síntesis repiten la condición. Persiste el nombre heredado de columna `proveedor_oss_mejor_candidato`, pero el valor y explicación ya impiden leerlo razonablemente como adopción. CRUD, extensiones, roles y API específica de SuiteCRM no están probados; conservar sus filas como hipótesis, nunca como cobertura integrada. |

**Observaciones adicionales de D02:** la distinción de C1 entre WhatsApp directo y envío por API, y el significado de “sincronización RFC 5545” afectan clasificación de `message.whatsapp_send` y `agenda.external_sync`. Deben resolverse junto con D02 antes de fijar el denominador. La propuesta D02 no es la ratificación de Wilber ni una modificación de C1.

**Dictamen vigente:** correcciones documentales comprobadas; cuatro hallazgos revalorados como arriba. D12-OSS-03 (identidad/PII), -06 (licencias por versión) y -07 (entrega vertical) permanecen abiertos sin evidencia nueva de prueba. Ningún porcentaje de entrega o cobertura OSS está verificado, ni se aprueba gate, producción o ampliación comercial.

## Tercera pasada · matriz de 32 brechas y firma digital

**Insumos nuevos:** `D21-cobertura-oss-brechas-2026-10-04.csv`, síntesis D21 actualizada y `D21-firma-digital-oss-2026-10-04.md`. Repetí lectura CSV con `csv.DictReader` y comparación de conjuntos de `key` con el catálogo inicial y las 32 filas del anexo. Resultado: **85 + 50 + 32 = 167 filas y 167 claves únicas**, intersecciones entre matrices vacías, ninguna clave inicial sin matriz y la nueva matriz cubre exactamente las 32 claves propuestas. En las 32: `clasificacion_d02` = 2 `C1_derivada_pendiente`, 21 `propuesta_programa`, 9 `por_definir`; `soporte_documental` = 17 `parcial`, 14 `desconocido`, 1 `no`, **0 `si`**. En la transversal actual: 7 `si`, 14 `parcial`, 23 `no`, 6 `desconocido`. Estas cifras coinciden con la síntesis D21. La cifra 167 sigue siendo **inventario exploratorio sin depurar**, no denominador C1/programa ratificado.

### D12-OSS-08 · P1 · Data Rooms de Papermark atribuidos como potencial OSS sin edición explícita en la matriz

`D21-cobertura-transversal-vre-2026-10-04.csv` conserva `dealroom.participants` con Papermark, soporte `parcial` y acción “Crear dataroom”, y `dealroom.activity` vincula la actividad de la sala al mismo proveedor. La [carpeta oficial `ee/` de Papermark](https://github.com/papermark/papermark/blob/main/ee/README.md) incluye **Data Rooms, Q&A y Advanced Permissions como Enterprise**. La nueva matriz de 32 y la síntesis D21 sí lo advierten para `dealroom.role_access`/`clientroom.access_revoke`; falta que las dos filas originales indiquen la edición comercial o cambien a lógica propia/alternativa no verificada. Mientras tanto no son cobertura OSS libre potencial. Dueño: D21; cierre: anotar edición y licencia por capacidad en la fila, más opción técnica local si se exige OSS sin pago.

### D12-OSS-09 · P2 · Excepción de licencia OpenSign y API autoalojada no verificadas

El apéndice D21 trata OpenSign como alternativa AGPL-3.0 y reconoce que su API publicada puede corresponder a sandbox/servicio alojado. La [licencia oficial](https://github.com/OpenSignLabs/OpenSign/blob/main/LICENSE) exceptúa expresamente `apps/OpenSignServer/cloud/customRoute`, si existe, bajo una licencia propia. No se comprobó si las rutas necesarias de firma/estado/webhook residen allí en un commit fijado. Mantener OpenSign como alternativa **no verificada** y completar mapa de archivo/ruta/licencia y prueba de API libre local antes de considerarlo proveedor. No inferir que todo el servidor o sus rutas API son AGPL por el encabezado general.

### Firma `document.signature`: clasificación correcta y límites

La fila transversal permanece `Sin candidato verificado` / `desconocido`; la síntesis no suma la firma a cobertura OSS ni a entrega. El apéndice propone LibreSign para **PoC local** porque el repositorio oficial publica [`openapi-full.json`](https://github.com/LibreSign/libresign/blob/main/openapi-full.json) y lo describe como app de Nextcloud [AGPL-3.0](https://github.com/LibreSign/libresign). Esto acredita una especificación publicada, **no** paridad real del ciclo de firma ni validez jurídica dominicana. [DocuSeal](https://www.docuseal.com/pricing) reserva API/embedding productivos al plan Pro, incluso on-premises; el apéndice lo clasifica correctamente como comparación y no API OSS gratuita. Los términos adicionales oficiales de [DocuSeal](https://github.com/docusealco/docuseal/blob/master/LICENSE_ADDITIONAL_TERMS) exigen conservar atribución en UI. El candidato LibreSign agrega operación Nextcloud, identidad de firmantes, certificados, custodia y retención; la PoC sintética y dictamen legal especializado previstos son condiciones adecuadas.

### D12-OSS-10 · P2 · Integridad de claves lograda, exhaustividad funcional no demostrada

El cruce 167/167 demuestra que las **32 brechas conocidas** tienen candidato o marca de desconocido, con fuente y limitación. No prueba que estén inventariadas todas las operaciones del programa: D02 aún no ratifica las dos derivaciones Academy ni decide 21 propuestas/9 definiciones, C1 61 no está depurado y las fichas Spec de P2/P4/P5 siguen pendientes. La síntesis D21 expresa estos límites de forma correcta. Para presentar el estudio, usar la denominación “**inventario exploratorio de 167 claves conocidas**” y mencionar los bloqueos abiertos; evitar “inventario completo de todas las funcionalidades” o porcentajes de cobertura. Cierre: catálogo versionado tras decisiones D02/cliente, fichas pendientes y barrido de omisiones por módulo/rol/flujo, revisado independientemente.

**Dictamen final de investigación:** aceptable como inventario exploratorio trazable **si conserva sus límites explícitos**. Antes de llamarlo completo o derivar un porcentaje, corregir D12-OSS-08, dejar D12-OSS-09 como licencia/API desconocidas por versión, reconciliar el mapa antiguo Cal.com/VPS y resolver alcance D02. D12-OSS-03 (PII/identidad) y D12-OSS-07 (prueba vertical) siguen abiertos para la integración. No se aprueba gate, cambio de C1 ni proveedor productivo.

## Cierre documental tras HND-038 · 4 de octubre

Leí las fuentes locales incluidas en `HND-038` y repetí el conteo de la matriz transversal: **50 claves únicas; 7 `si`, 12 `parcial`, 23 `no`, 8 `desconocido`**. `academy.quiz` está `parcial` porque el PDF citado prueba actividad en la UI de Moodle, no la API de intento/nota. `dealroom.participants` y `dealroom.activity` ahora son **CRM propio / `desconocido`** y dicen expresamente que Papermark Data Rooms es Enterprise: **D12-OSS-08 queda cerrado en el plano documental**. El aviso inicial de `MAPA-SISTEMAS-OSS.md` marca como históricas sus referencias a Cal.com/VPS y remite a la corrección Cal.diy: **D12-OSS-01 queda mitigado documentalmente**, sin aprobar Cal.diy para producción. `document.signature` continúa `desconocido`.

Permanecen **abiertos** el contrato de identidad, permisos y PII entre servicios (D12-OSS-03), la ratificación C1 y su denominador (D12-OSS-04), las pruebas de API/edición y de integración vertical (D12-OSS-02/-07), y las licencias/rutas por versión, incluida la excepción OpenSign (D12-OSS-06/-09). El handoff HND-038 está en `review_pending`; esta nota no lo aprueba ni registra gate. El resultado sigue siendo un inventario exploratorio, sin porcentaje de entrega medido.
