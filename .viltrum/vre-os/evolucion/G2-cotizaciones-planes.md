# Expediente de evolución · Cotizaciones y planes de pago (M16)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21+D03+D05, grupo G2, 14-oct-2026. Solo lectura de `src/` y web.
> Reglas: misma tecnología primero. Copiar o portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia). AGPL/GPL solo RUN o referencia.
> **Frontera con Cobros (M22), de otro grupo:** M22 es dueño de las plantillas de plan (`payment_plan_templates`), del plan persistido **después** de la venta (`unit_sales`), de los pagos y del estado de cuenta. M16 es dueño de la **cotización previa a la venta**: precio, descuento, vigencia, versiones, PDF y envío. M16 **consume** de M22 la función pura `previsualizarPlan` y las plantillas; no crea tablas de plan. Si M22 cambia (su revisión D12/D14 del 14-oct la declara «no apta para READY»), este expediente cambia con ella.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 1 | Solo una calculadora: `POST /api/cotizador/confotur` devuelve un JSON (`src/app/api/cotizador/confotur/route.ts:24-52`) con plan de pago, ahorro fiscal y retorno. Sin pantalla, sin PDF, sin cotización guardada (inventario D21 §1, fila «confotur»). |
| Datos reales y reglas de negocio | 1 | Dominio puro (`src/domain/confotur.ts:68-127`), sin tabla `quotes` ni lista de precios; recibe `precioVentaCents` a mano, no una unidad. Plan por defecto **20/30/50** (`confotur.ts:77-79`, `route.ts:18-20`), mientras M22 y el plan integral hablan de 10/40/50 (revisión D12/D14 de M22, B-07). |
| Diseño y componentes | 0 | No hay interfaz (`rg` de `cotizador` bajo `src/app/(crm)`: sin coincidencias; el único rastro visual de Confotur es el distintivo de Propiedades). |
| Experiencia de uso | 0 | No existe flujo: el equipo cotiza fuera del CRM. |
| Calidad (pruebas, seis estados, accesibilidad) | 2 | `src/domain/confotur.test.ts` prueba el cálculo; la ruta exige `requireScope(actor,"projects","view")` (`route.ts:29`). Sin pruebas de ruta, sin estados. |

Objetivo de este programa: 4.

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **Dos políticas de plan conviven y chocan.** El cotizador real usa 20 % inicial / 30 % construcción / 50 % contra entrega (`confotur.ts:77-79`; `route.ts:18-20`); M22 siembra 10/40/50 (M22 S-22-14). Un comprador recibiría una cotización 20/30/50 y un plan de cobro 10/40/50. Es una decisión de negocio (Wilber), no técnica; hasta que la tome, ninguna de las dos debe quedar como «por defecto» silencioso.
2. **El ahorro fiscal se calcula para cualquier precio, sin mirar si el proyecto es Confotur.** `confotur.ts:109-117` calcula 3 % de transferencia y 1 % anual de IPI durante 15 años sin recibir proyecto ni unidad; la ruta tampoco los pide. Efecto: una cotización de un proyecto no elegible muestra ahorros que no existen. Además la fórmula es una simplificación (D21 catálogo B.2 la marca «media (sec.)» y advierte que la Ley 30-26 añade una regla de no acumulación de incentivos con alcance sin precisar). Debe vivir como regla **versionada** (`tax.rule_version`), con la etiqueta «estimado», enlazada al estado legal del proyecto (Propiedades PR-05).
3. **Se cotiza un número libre, no una unidad.** La entrada es `precioVentaCents` (`route.ts:14`); no hay descuento ni aprobación (A4.4), ni se guarda quién cotizó qué ni cuándo (la ruta no escribe auditoría). Cualquier rol con `projects:view` (incluido broker) puede producir una «cotización» con el precio que quiera. Nada impide prometer un precio por debajo del acordado.
4. **Tensión sin resolver con la regla firmada del precio.** La decisión #47 dice que el precio de lista real solo lo ve el admin y el broker ve su **monto comercial**. ¿Qué precio cotiza un broker? Hace falta un tercer precio explícito («precio de venta publicado», visible al broker, distinto del precio real interno) en la lista de precios, o cotizar siempre el monto comercial del negocio. **Pregunta para Wilber antes de la ficha** (S-16-01).
5. **Moneda sin control.** `moneda` es texto libre con valor por defecto USD (`route.ts:17`); no existe DOP, ni tasa, ni fecha de tasa (A4.3). El comprador de la diáspora paga en USD pero muchos pagan la cuota en DOP (M22 A7.5).
6. **El reparto se desajusta en silencio.** Si la reserva supera el pago inicial, `separacionCents` queda en 0 y el contra entrega se reduce (`confotur.ts:75,89,98`): el plan real deja de ser 20/30/50 sin avisar. Las cuotas mensuales no tienen fecha, y `mesesConstruccion` vale 24 aunque el proyecto tenga `estimated_delivery_date` (`schema.ts`, `projects.estimatedDeliveryDate`), que no se usa.
7. **Promesa de rentabilidad sin fuente.** `roiAnualEstimado` por defecto 9 % (`confotur.ts:119`) y `ingresoBrutoAnualEstimadoCents` se devuelven como dato; es una afirmación comercial. Debe ser un supuesto editable con fuente y aviso, y no aparecer por defecto.
8. **Sin pruebas de dinero a nivel de ruta ni de auditoría**, y porcentajes como `number` decimales: `porcentajeInicial` 0–100 con coma flotante (suma comparada con tolerancia 0,01, `confotur.ts:83`). M22 resuelve esto con puntos básicos enteros; la cotización debe usar la misma representación.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| CP-01 | Cotización persistida: número `COT-AAAA-NNNNNN`, negocio/contacto/unidad, vigencia, estado (borrador, emitida, aceptada, vencida, reemplazada), **versiones** inmutables | ESENCIAL | A4.2 | No existe |
| CP-02 | Precio tomado de la lista vigente (Propiedades PR-04) con snapshot; nunca de un número libre | ESENCIAL | A3.3, A4.2 | Número libre |
| CP-03 | Plan de pago desde una plantilla de proyecto (M22), con vista previa en vivo, fechas reales y suma exacta (residuo a la última cuota) | ESENCIAL | A4.1 | Calculadora fija |
| CP-04 | Multimoneda: precio base USD, equivalente DOP con **tasa congelada y fecha** en la cotización | ESENCIAL | A4.3 | Texto libre |
| CP-05 | PDF de marca ES/EN (USD y DOP), con apartado, separación, cuotas, contra entrega, vigencia, aviso legal y ahorro estimado | ESENCIAL | A4.2 | No existe |
| CP-06 | Descuentos y promociones con tope por rol (tabla de decisión) y aprobación de un segundo admin | IMPORTANTE | A4.4, A19.2 | No existe |
| CP-07 | Beneficios Confotur versionados, visibles solo si el proyecto está clasificado, con etiqueta «estimado» | ESENCIAL | A4.5 | Siempre se calcula |
| CP-08 | Gastos de cierre estimados (transferencia, legales, notaría, deslinde) como tabla de reglas versionada | IMPORTANTE | A4.6 | No existe |
| CP-09 | Proyección de renta/retorno con supuestos explícitos y editables (nunca por defecto) | IMPORTANTE | A4.7 | 9 % fijo |
| CP-10 | Envío por WhatsApp/correo con enlace o PDF, seguimiento («enviada», «abierta») y recordatorio de vencimiento como tarea | IMPORTANTE | A2.1 | No existe |
| CP-11 | Comparador de hasta 3 unidades o 2 planes en un solo PDF | IMPORTANTE | — | No existe |
| CP-12 | Convertir la cotización aceptada en reserva (Reservas) y congelar precio y plan | ESENCIAL | A5.1 | No existe |
| CP-13 | Calculadora hipotecaria / pre-calificación (referencia a financiamiento) | DESEABLE | A4.8 | No existe |
| CP-14 | Analítica: cotizaciones emitidas → reservas, descuento medio, motivos de pérdida por precio | DESEABLE | A13 | No existe |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| @react-pdf/renderer | `diegomura/react-pdf` @ `e7b14db1e53d` (7-oct-2026); npm `4.9.0` (27-ago-2026) | MIT (`LICENSE` leído) | TypeScript/React | `renderToBuffer`, `Document/Page/View/Text/Image/Font.register` para el PDF de cotización (CP-05) y la base de PDF compartida (estado de cuenta de M22 L12, disponibilidad de Propiedades, contrato) | APP | Peer React 19 admitido (registro npm). Fuentes de marca por `Font.register`. **Hay que probarlo con Next 15 en modo servidor** (§8) | M |
| GoRules ZEN Engine | `gorules/zen` @ `c8a7d89a6b05` (13-oct-2026); npm `@gorules/zen-engine@2.1.7` (13-oct-2026) | MIT (`LICENSE` leído) | Rust con enlace nativo a Node | `ZenEngine.createDecision(jdm).evaluate(contexto)`: tabla de decisión para tope de descuento por rol y para reglas fiscales versionadas; los JDM se guardan como JSON en BD | APP (en el proceso Node; el mapa OSS decía RUN) | Necesita binario nativo, solo servidor (no Edge). `@gorules/zen-engine-wasm@0.23.1` (MIT) existe pero está atrasada respecto al motor | M |
| GoRules JDM Editor | `gorules/jdm-editor` @ `283bb11da324` (13-may-2026); npm `@gorules/jdm-editor@1.52.0` | MIT (`LICENSE` leído) | TypeScript/React ≥18 | `DecisionGraph`: editor visual de las tablas de decisión para el admin | APP (fase posterior) | Trae su propio estilo (Ant Design según su ecosistema; **no verificado**) y puede chocar con shadcn; solo si el admin edita reglas | L |
| json-rules-engine | npm `7.3.1` (feb-2025) | ISC (registro npm) | JavaScript | Alternativa ligera si Zen resulta pesado: reglas como JSON | APP (alterno) | Sin editor visual; se descarta si Zen funciona | S |
| n2words | npm `6.3.0` (30-sep-2026) | MIT (registro npm) | JavaScript | Importe en letras para el PDF (y para Contratos CT-04) | APP | Soporte de español **por confirmar al instalar** (§8) | S |
| qrcode | npm `1.5.4` | MIT (registro npm) | JavaScript | QR en el PDF hacia la ficha pública del proyecto del Portal | APP | Solo servidor | S |
| @react-email/components | npm `1.0.12` | MIT (registro npm) | TypeScript | Correo de envío de cotización | APP | React 18/19 | S |
| financial | `lmammino/financial`; npm `0.2.4` (jul-2024) | MIT (registro npm) | TypeScript | **Solo oráculo de prueba** para PMT/IPMT de la calculadora hipotecaria (CP-13) | REF | Usa coma flotante; el cálculo de producción se escribe con enteros/BigInt como M22 | S |
| dinero.js | `dinerojs/dinero.js` @ `76b969e519dc`; npm `2.0.2` | MIT (`LICENSE` leído) | TypeScript | Evaluado y **descartado**: M22 define su propia conversión BigInt (`domain/cobros.ts`) y dos formas de dinero son una fuente de errores | REF | — | — |
| Sell.Do (hojas de costos, planes por plantilla) | comercial | — | — | Ideas: hoja de costos, bloqueo mientras el cliente paga | REF | Solo ideas (catálogo A.1) | — |

**Qué no adaptamos.** No hay un cotizador inmobiliario OSS permisivo en TypeScript que haya podido leer; no se adapta código de ningún tercero en este módulo: el valor está en el modelo de datos y las reglas, propios. **Riesgos:** Zen exige binario nativo (despliegue en la VPS Node, no en entornos sin esos binarios); el editor de reglas es opcional y puede posponerse; react-pdf tiene límites de maquetación (tablas largas con saltos de página) que hay que probar.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Asistente de cotización en tres pasos (Unidad · Plan · Revisión), una acción primaria por vista | Página `/cotizaciones/nueva` con `Tabs` como pasos, `Card`, `Select`, `Input`, `Drawer` en móvil | Alta |
| Vista previa del PDF en vivo | Panel derecho en escritorio, pestaña en móvil; el mismo componente `CotizacionPdf` que genera el archivo (`pdf()` de react-pdf en cliente sería pesado: se renderiza en servidor al emitir y se muestra HTML equivalente mientras se edita) | Alta/Detalle |
| Cronograma del plan | Tabla semántica y tarjetas en móvil; barra de composición apartado/separación/cuotas/contra entrega con `chart.tsx` | Alta/Detalle |
| Estado y vigencia | `Badge` con tonos de `tone.ts`; cuenta regresiva de vigencia | Lista |
| Lista de cotizaciones por negocio y global | `data-table.tsx`, filtros en la URL, columnas: número, unidad, monto, descuento, estado, vigencia | `/cotizaciones` |
| Descuento y aprobación | Diálogo `Dialog` con motivo y tope visible; estado «pendiente de aprobación» | Detalle |
Seis estados en lista, alta y detalle; el PDF y el correo respetan los tokens de marca (`docs/DESIGN.md`: navy, dorado solo en acción y cifras importantes). Cifras en USD y DOP nunca sumadas; el aviso legal y la etiqueta «estimado» van en el pie de cada PDF.

## 6. Comunicación con el resto (centralización)
- **Consume de Propiedades:** lista de precios vigente y su `price_list_item_id`; estado legal (PR-05) para decidir si se muestra Confotur; `estimated_delivery_date` para fechar el cronograma.
- **Consume de Cobros (M22):** `payment_plan_templates` (+ `previsualizarPlan`), tipos de cambio (`exchange_rates`) y la función BigInt de conversión; **propone a M22 una línea `fixed_amount` («apartado») en la plantilla**, porque el apartado de US$2.000 del cotizador (`confotur.ts:75`, `reservaCents`) hoy no cabe en líneas solo en puntos básicos.
- **Emite (outbox, `OBX`):** `CotizacionEmitida`, `CotizacionAceptada` (consumida por Reservas y por Negocios para actualizar `deals.amount_cents`), `CotizacionVencida` (Tareas/Comunicaciones), `DescuentoSolicitado` (aprobaciones).
- **Puertos:** `ReglasPort` (Zen), `GeneradorPdfPort` (react-pdf; el mismo que usan Cobros, Contratos y Propiedades), `MensajeriaPort`, `AlmacenamientoArchivos` (PDF emitidos inmutables, con su hash).
- **Reglas firmadas:** el broker no ve precio real ni comisión (#47); cotización emitida no se edita (se versiona); aprobación de descuentos con un segundo admin y caducidad de 7 días (#47).

## 7. Lotes asignables
Todos requieren ficha **M16-cotizaciones READY** (no existe). Primero hay que resolver S-16-01 (qué precio cotiza el broker) y la política 20/30/50 vs 10/40/50 (Wilber). `PDF` = lote CP-L2. `M22-L1` = dominio puro de Cobros.

| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| CP-L1 | Arreglos del cotizador actual: exigir proyecto/unidad opcional, no devolver ahorro fiscal si el proyecto no es elegible, porcentajes en puntos básicos enteros, aviso si la reserva supera el inicial, quitar el 9 % por defecto; pruebas de bordes | `src/domain/confotur.ts`, `confotur.test.ts`, `src/app/api/cotizador/confotur/route.ts`, `src/application/confotur/**` | M16 | Sonnet | Codex + D12 | PR-L1 (estado Confotur real) |
| CP-L2 | Base de PDF compartida: puerto `GeneradorPdfPort`, `src/infrastructure/pdf/base.tsx` (encabezado de marca, fuentes registradas, pie legal), prueba de humo con Next 15 que genera un PDF real y comprueba su cabecera `%PDF` | `src/application/compartido/pdf.ts`, `src/infrastructure/pdf/*`, `package.json` | M16 / I08 | Sonnet | D14 + Codex | — |
| CP-L3 | Dominio de cotización: estados, versionado inmutable, descuento con tope, equivalente DOP con tasa congelada; funciones puras con pruebas | `src/domain/cotizaciones.ts`, `.test.ts` | M16 | Sonnet | Codex | M22-L1, PR-L8 (modelo de lista de precios) |
| CP-L4 | Esquema: `quotes`, `quote_versions`, `quote_discounts`; RLS; migración aditiva | `schema.ts`, `drizzle/00NN_*.sql`, `catalogs.ts` (`quotes` en recursos y entidades) | M16 (ficha de datos) | Sonnet (D11) | D12 + D14 | CP-L3 |
| CP-L5 | Casos de uso (`crearCotizacion`, `emitirVersion`, `solicitarDescuento`, `resolverDescuento`, `aceptarCotizacion`) con unidad de trabajo, auditoría y evento | `src/application/cotizaciones/**` | M16 | Sonnet | D12 + Codex | CP-L4, `OBX` |
| CP-L6 | Rutas `api/cotizaciones/**` con Zod estricto, `requireScope` y filtro por `:id`; extender `precios-respuestas.test.ts` con centinelas | `src/app/api/cotizaciones/**`, pruebas de seguridad | M16 | Sonnet | D12 | CP-L5 |
| CP-L7 | PDF de cotización (ES/EN, USD/DOP) con `CotizacionPdf`; pruebas de contenido (texto extraído) | `src/infrastructure/pdf/cotizacion.tsx`, caso de uso de emisión | M16 | Sonnet | D14 | CP-L2, CP-L5 |
| CP-L8 | Pantallas `/cotizaciones` (lista) y `/cotizaciones/nueva` (asistente de 3 pasos) con seis estados | `src/app/(crm)/cotizaciones/**`, `modulos.ts` | M16 | Sonnet | D07 + D14 | CP-L6 |
| CP-L9 | Detalle de cotización: versiones, descuento, aprobación, estado, enlace desde la ficha de Negocios | `cotizaciones/[id]/**` | M16 | Sonnet | D14 | CP-L8 |
| CP-L10 | Reglas Zen: tope de descuento por rol y beneficios Confotur versionados (JDM en BD); `ReglasPort` con doble en memoria | `src/application/compartido/reglas.ts`, `src/infrastructure/reglas/zen.ts`, tabla `decision_rules` | M16b-reglas | Sonnet | D12 + Codex | CP-L4 |
| CP-L11 | Envío: correo con `@react-email`, WhatsApp por `MensajeriaPort`, estado «enviada/abierta» | `src/infrastructure/correo/**`, caso de uso | M16c-envio | Sonnet | D12 | CP-L7, M11 |
| CP-L12 | Gastos de cierre y proyección de renta como reglas versionadas con supuestos visibles | reglas, UI de supuestos | M16b | Sonnet | Codex | CP-L10 |
| CP-L13 | Comparador de hasta 3 unidades en un PDF | PDF + UI | M16d | Haiku | D14 | CP-L7 |
| CP-L14 | Conversión a reserva (`CotizacionAceptada` → `crearReserva`) con congelado de precio | caso de uso, contrato de evento | M16 + M17 | Sonnet | D12 | RS-L3 |

## 8. No verificado
- Que `@react-pdf/renderer` 4.9.0 funcione con Next 15 / React 19 en rutas del servidor sin ajustes (la dependencia declara React 19 en `peerDependencies`; no hice la prueba).
- Que `@gorules/zen-engine` cargue su binario nativo en Windows y en la VPS de despliegue; que el motor se pueda usar en el `runtime` Node de Next sin empaquetado especial.
- Estilo y dependencias de `@gorules/jdm-editor` frente a shadcn (no inspeccioné su `package.json`).
- Soporte de español de `n2words` y de moneda («DÓLARES», «PESOS DOMINICANOS»): hay que ejecutar un caso.
- Fórmulas fiscales: tasa de 3 % de transferencia, IPI 1 % durante 15 años y el efecto de la Ley 30-26; el D21 catálogo B.2 las marca como fuentes secundarias. Ningún contador las ha validado.
- Gastos de cierre reales en RD (transferencia, deslinde, notaría): no investigados.
- Obligaciones legales sobre la publicidad de rentabilidad estimada: no investigadas.
- Que existan fuentes oficiales de tipo de cambio (BCRD) con API estable: M22 lo declara fuera del núcleo.
