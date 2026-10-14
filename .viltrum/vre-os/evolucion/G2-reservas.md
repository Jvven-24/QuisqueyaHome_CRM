# Expediente de evolución · Reservas y apartados (M17)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21+D03+D05, grupo G2, 14-oct-2026. Solo lectura de `src/` y web.
> Reglas: misma tecnología primero. Copiar o portar solo MIT, Apache-2.0, BSD o ISC. AGPL/GPL solo RUN o referencia. Nada se incrusta.
> **Módulo de nivel 0 en código.** El estado `reserved` existe como valor de `units.status`, pero no hay reserva: ni tabla, ni caducidad, ni pantalla. Este expediente fija el diseño objetivo y su frontera con Propiedades (estado de unidad), Negocios (cierre), Cotizaciones y Cobros (M22).

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 0 | Sin ruta, sin caso de uso, sin tabla. `crm-mapa-modulos` M17: «Estado de unidad reserved no acredita reserva, caducidad ni workflow propio». |
| Datos reales y reglas de negocio | 1 | `units.status` admite `reserved` (`schema.ts`, `UNIT_STATUSES` en `catalogs.ts`) y se escribe de dos formas: a mano (`api/proyectos/[id]/unidades/[unitId]/route.ts:24`) o por el cierre de un alquiler (`application/pipeline/cierre.ts:124`). La venta está protegida por `unit_sales` (índices únicos, `schema.ts:758-770`). Nada protege un apartado. |
| Diseño y componentes | 0 | No hay interfaz. |
| Experiencia de uso | 0 | No hay flujo; el broker no puede apartar ni ver quién tiene apartada una unidad. |
| Calidad | 0 | Sin pruebas de concurrencia; la prueba objetivo (100 intentos simultáneos → 1 éxito) está escrita en el mandato (`M-20261004-VRE.md`, W4) y no existe. |

Objetivo de este programa: 4.

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **El cierre actual no admite una unidad apartada, ni siquiera por quien la apartó.** `cierre.ts:91` exige `unidad.status === "available"` o falla con «La unidad ya no está disponible para este cierre». En cuanto exista una reserva viva, el propio comprador que la hizo no podría cerrar su negocio. Hay que cambiar el cierre (Negocios, M03) para aceptar `reserved` **solo si la reserva viva pertenece al mismo negocio**, y consumirla en la misma transacción. Es el cambio más delicado del módulo: toca un archivo de otro grupo.
2. **Cualquiera con permiso de edición de unidades puede poner `reserved`, `sold` o `available` a mano** (`unidades/route.ts:25`, `[unitId]/route.ts:24`). Una reserva que no pase por una sola puerta (`cambiarEstadoUnidad`, I04 §2.1) no se puede garantizar. Mientras ese campo siga editable, el módulo de reservas no puede afirmar «cero dobles reservas».
3. **El apartado se cobra antes de que exista una venta, y Cobros (M22) solo conoce planes que cuelgan de `unit_sales`** (M22 §1 y §5: `payment_plans.unit_sale_id`). Por tanto el dinero del apartado no tiene dónde vivir hoy. Hay que decidir (propuesta en §6): una tabla propia de depósitos de apartado que luego se acredita como primer pago del plan; M22 debe aceptar un «apartado acreditado» al crear el plan. Sin esto, el equipo tendrá el apartado en una hoja de cálculo.
4. **No existe un tercer eje de tiempo en el sistema**: no hay planificador de caducidades. El único ejecutor verificado es el worker del outbox (`scripts/outbox-worker.mjs`, bucle de 30 s por defecto según la revisión D12 de M22) y M22 reconoce que su barrido de mora no tiene dueño (S-22-09). Una reserva «con caducidad» sin ejecutor se vuelve un bloqueo permanente. La caducidad debe **derivarse al leer** (reserva con `expires_at` pasado = no vigente) y limpiarse después por el worker.
5. **Doble reserva por carrera.** `marcarUnidad` hace `UPDATE units SET status = …` sin condición sobre el estado anterior (`repos/pipeline.ts:192-194`); en la reserva el patrón correcto es un índice único parcial en BD, no una comprobación en la aplicación.
6. **El compromiso legal del apartado no está definido**: devolución, penalidad, plazo y a quién se le informa (A5.4). Sin política firmada por Wilber/abogado, el módulo no debe prometer reembolsos en pantalla.
7. **PLAFT**: aceptar un apartado en efectivo o de un tercero es un punto de control (A18.4/18.6, umbral de efectivo según fuentes secundarias del catálogo D21). El módulo debe dejar el gancho (registrar medio, pagador, tercero) aunque el programa PLAFT sea otro frente.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| RS-01 | **Reserva con exclusión garantizada por la base**: una reserva viva por unidad (índice único parcial); 100 intentos simultáneos producen 1 éxito y 99 respuestas 409 explícitas | ESENCIAL | A5.1 | No existe |
| RS-02 | Caducidad por proyecto (p. ej. 48 h / 7 días) con cuenta regresiva visible, prórroga con aprobación y liberación automática de la unidad | ESENCIAL | A3.2, A5.1 | No existe |
| RS-03 | Todo cambio de estado de la unidad por `cambiarEstadoUnidad` (una sola puerta, con motivo, auditoría y evento) | ESENCIAL | A3.2 | Edición libre |
| RS-04 | **Depósito de apartado**: monto, moneda (USD/DOP) con tasa congelada, medio, referencia, comprobante, recibo `AP-AAAA-NNNNNN` no fiscal; se acredita como primer pago del plan al cerrar | ESENCIAL | A5.2, A5.3 | No existe |
| RS-05 | Compradores de la reserva: titular, co-compradores y persona jurídica (con beneficiario final como dato; verificación es del programa PLAFT) | ESENCIAL | A5.5 | No existe |
| RS-06 | Política de devolución/penalidad congelada al apartar (texto versionado) y registro de la liquidación al cancelar | IMPORTANTE | A5.4 | No existe |
| RS-07 | Formulario de apartado en PDF (datos del comprador, unidad, precio de la cotización, condiciones) | ESENCIAL | A5.3 | No existe |
| RS-08 | Convertir la reserva en venta (cierre del negocio) sin soltar la unidad entre un paso y otro | ESENCIAL | A5.1 | El cierre la rechazaría |
| RS-09 | Lista de espera por unidad: al liberarse, se notifica al siguiente y se le da un plazo | DESEABLE | A5.6 | No existe |
| RS-10 | Límites anti-acaparamiento: máximo de reservas vivas por broker, configurable; el admin puede forzar la liberación con motivo | IMPORTANTE | — | No existe |
| RS-11 | Tablero de reservas (por proyecto y torre) en la matriz de Propiedades: color «apartada», quién, hasta cuándo | IMPORTANTE | A3.5 | No existe |
| RS-12 | Alertas: reserva por vencer (tarea al broker), reserva vencida, apartado sin pago | IMPORTANTE | A2.5 | No existe |
| RS-13 | Pasarela de pago en línea (Azul/Cardnet) para el apartado | DESEABLE | A5.2 | No existe |

## 4. Open source que aporta (verificado)
Honestidad primero: **no encontré un componente de reservas de inventario inmobiliario OSS, permisivo y en TypeScript** que adaptar (la búsqueda de desarrolladoras con inventario, apartado y plan de pago en GitHub devolvió CRMs genéricos y un sitio de portafolio, ver `G2-propiedades.md` §4). Las garantías de este módulo vienen de PostgreSQL, que ya es nuestra base, y no de un proyecto externo.

| Proyecto | Repo + commit/tag | Licencia | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| PostgreSQL (índice único parcial, `SELECT … FOR UPDATE`, restricciones `CHECK`) | ya en uso; el índice parcial con `WHERE` ya existe en `schema.ts:766` (`unit_sales_unit_unq`) y en `deal_properties` | PostgreSQL License | SQL | `CREATE UNIQUE INDEX … ON unit_reservations (unit_id) WHERE status = 'active'` → RS-01 | APP (patrón propio) | Drizzle lo expresa con `uniqueIndex(...).where(sql…)` como en el resto del esquema | S |
| pg-boss | `timgit/pg-boss`; npm `12.38.0` (13-oct-2026) | MIT (registro npm; LICENSE del repo **no leído**) | TypeScript | Cola/cron sobre PostgreSQL para caducar reservas y barridos si se decide no usar el worker del outbox | APP (opcional) | Crea su propio esquema en la base; añade una pieza que operar | M |
| graphile-worker | npm `0.18.0` (8-sep-2026) | MIT (registro npm) | TypeScript | Alternativa al anterior (tareas y cron sobre Postgres) | APP (alterno) | Igual consideración | M |
| croner | npm `10.0.1` (feb-2026) | MIT (registro npm) | TypeScript | Programar el barrido dentro del worker existente sin dependencia de base | APP | Mínimo; encaja en `scripts/outbox-worker.mjs` | S |
| Sell.Do (bloqueo de 15 min mientras el cliente paga, ciclo de vida de reserva) | comercial | — | — | Ideas de producto (catálogo D21 A.1) | REF | — | — |
| EspoCRM Real Estate (AGPLv3) | extensión comercial/AGPL | AGPLv3 | PHP | Ideas de coincidencia comprador–unidad (A1.8) | REF | No se copia ni se ejecuta | — |

**Decisión técnica propuesta:** sin dependencia nueva para el núcleo (índice parcial + transacción + `Reloj` inyectado); el barrido de caducidad se engancha al worker existente con `croner` o con la propia vuelta del bucle; `pg-boss` solo si Wilber acepta operar otro componente. **Riesgo:** operar un planificador (D16) es el verdadero cuello de botella, no el código.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Acción «Apartar unidad» desde la matriz y la ficha de unidad | `Dialog` con pasos: comprador(es) · depósito · condiciones · confirmar (una acción primaria) | Propiedades y Negocios |
| Reserva viva con cuenta regresiva y barra de tiempo | `Badge` + cuenta regresiva accesible (`aria-live` cada minuto, no cada segundo) | ficha de unidad, lista |
| Lista de reservas | `data-table.tsx`; filtros por proyecto, broker, estado (viva, por vencer, vencida, convertida, cancelada) | `/reservas` |
| Detalle de reserva | `Sheet`/`Drawer`: línea de tiempo (creada, depósito, prórroga, conversión), documentos adjuntos | `/reservas/[id]` |
| Conflicto 409 | Mensaje claro «Esta unidad fue apartada hace 3 minutos por otro broker (hasta las 4:15 p. m.)» sin revelar datos del comprador ajeno | diálogo |
| Estados | Seis estados; sin conexión: solo lectura, apartar desactivado | todo |
Móvil primero (el broker aparta desde el teléfono en la sala de ventas): botón primario fijo en pie, objetivos ≥48 px, confirmación explícita contra doble toque.

## 6. Comunicación con el resto (centralización)
- **Tablas propuestas (ficha de datos nueva):** `unit_reservations` (unidad, negocio, cotización/versión, estado `active|converted|expired|cancelled`, `reserved_at`, `expires_at`, política congelada, `released_reason`), `reservation_parties` (titular, co-compradores, persona jurídica), `reservation_deposits` (depósito con moneda, tasa congelada, recibo `AP-…`), `reservation_extensions` (prórrogas con aprobación). Todas con RLS y FK `RESTRICT`.
- **Una sola puerta de estado:** `cambiarEstadoUnidad` (I04 §2.1) con transiciones permitidas `available → reserved → sold | available` y rechazo de cualquier otra; `editarUnidad` pierde el campo `status`.
- **Emite (outbox):** `ReservaCreada`, `ReservaProrrogada`, `ReservaVencida`, `ReservaCancelada`, `ReservaConvertida`, `DepositoApartadoRegistrado`. Consumen: Propiedades/Portal (`DisponibilidadCambiada`), Negocios (etapa «Reserva» automática), Comunicaciones (aviso), Tareas (seguimiento), Cobros (acreditar depósito).
- **Consume:** `CotizacionAceptada` (Cotizaciones) para crear la reserva con el precio congelado; `VentaCerrada` no se consume: lo emite el cierre dentro de la misma transacción que consume la reserva.
- **Frontera con M22 (a negociar):** el depósito de apartado se guarda en `reservation_deposits`; al crear el plan, M22 acredita ese importe como primer pago imputado a la línea «separación». M22 debe añadir un campo `prepaid_from_reservation_id` o equivalente (cambio de su ficha, no de este expediente). Las funciones de dinero (BigInt, tasa congelada) son las de `domain/cobros.ts` (M22-L1), no una copia.
- **Permisos (propuesta):** recurso nuevo `reservations` (`view|create|edit` y `edit` en alcance `all` para prórroga/forzar liberación con segundo admin). Broker: crea y ve las suyas; asistente: según decisión #47 propone y un admin aprueba; ver B-04 de la revisión D12 de M22 para el mismo problema.

## 7. Lotes asignables
Todos requieren **ficha M17-reservas READY** (no existe) y, para esquema, ficha de datos. Dependencias comunes: `UND` = `cambiarEstadoUnidad` de I04; `OBX` = cola del outbox filtrada por tipo (M22-L7).

| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| RS-L1 | Dominio puro: máquina de estados de reserva, cálculo de caducidad (horas hábiles opcional, zona America/Santo_Domingo), prórroga; pruebas de bordes de medianoche | `src/domain/reservas.ts`, `.test.ts` | M17 | Sonnet | Codex | — |
| RS-L2 | Esquema: `unit_reservations`, `reservation_parties`, `reservation_deposits`, `reservation_extensions`, con **índice único parcial por unidad viva**, RLS, migración aditiva; seed mínimo | `schema.ts`, `drizzle/00NN_*.sql`, `scripts/seed/*`, `catalogs.ts` | M17 (datos) | Sonnet (D11) | D12 + D14 | RS-L1 |
| RS-L3 | `crearReserva` con transacción, `cambiarEstadoUnidad`, expiración al leer, idempotencia por clave del cliente | `src/application/reservas/{puertos,casos-de-uso,en-memoria}.ts` + pruebas | M17 | Sonnet | D12 + Codex | RS-L2, `UND` |
| RS-L4 | **Prueba de concurrencia en BD**: 100 conexiones intentan apartar la misma unidad → 1 éxito, 99 `409`, cero filas de más; la mutación (quitar el índice) hace fallar la prueba | `scripts/test-db/reservas.ts`, `src/infrastructure/db/reservas.db.test.ts`, `scripts/test-db/run.mjs` (registro) | M17 | Sonnet | D14 (mutación independiente) | RS-L3 |
| RS-L5 | Repositorio Drizzle de reservas y consulta de vigentes con alcance (`visibleRows`) | `src/infrastructure/db/repos/reservas.ts` | M17 | Sonnet (D11) | D12 | RS-L2 |
| RS-L6 | Retirar `status` de la edición genérica de unidades y enrutar el cierre de alquiler por `cambiarEstadoUnidad` | rutas de unidades, `cierre.ts` (con ficha M03), pruebas | I04 + M03 | Sonnet | D12 + Codex | `UND` |
| RS-L7 | **Cierre acepta unidad reservada por el mismo negocio** y consume la reserva en la misma transacción; prueba de que otro negocio no puede | `src/application/pipeline/cierre.ts`, `repos/pipeline.ts`, pruebas, `scripts/test-db/cierre.ts` | M03 (enmienda) + M17 | Sonnet | D12 + Codex | RS-L3 |
| RS-L8 | Depósito de apartado: caso de uso, recibo, tasa congelada con la función compartida, anulación con segundo admin (mismo patrón que M22 CA-12) | `src/application/reservas/depositos.ts`, pruebas | M17 | Sonnet | D12 | RS-L3, M22-L1 |
| RS-L9 | Rutas `api/reservas/**` (Zod estricto, `requireScope`, `:id` con alcance) y pruebas de seguridad extendidas | `src/app/api/reservas/**`, `seguridad-rutas-id.test.ts` | M17 | Sonnet | D12 | RS-L5, RS-L8 |
| RS-L10 | Caducidad: barrido `expirarReservas` enganchado al worker con `croner` o a la vuelta del bucle; eventos `ReservaVencida` | `src/application/reservas/vencimientos.ts`, `scripts/outbox-worker.mjs` (solo el registro) | M17 + D16 | Sonnet | D12 | RS-L3, `OBX` |
| RS-L11 | Diálogo «Apartar unidad», lista `/reservas` y detalle, con seis estados y móvil | `src/app/(crm)/reservas/**`, `modulos.ts` | M17 | Sonnet | D07 + D14 | RS-L9 |
| RS-L12 | Color y datos de «apartada» en la matriz de Propiedades y en la ficha de unidad | `propiedades/[slug]/**` (con PR-L6) | M04 + M17 | Sonnet | D14 | RS-L11, PR-L6 |
| RS-L13 | Formulario de apartado en PDF con la base compartida | `src/infrastructure/pdf/apartado.tsx` | M17 | Sonnet | D14 | CP-L2 |
| RS-L14 | Límite de reservas por broker y liberación forzada con segundo admin | casos de uso, config | M17 | Haiku | D12 | RS-L9 |
| RS-L15 | Lista de espera por unidad (opcional) | esquema + caso de uso | M17b | Sonnet | Codex | RS-L10 |

## 8. No verificado
- La política comercial y legal del apartado (plazo, reembolso, penalidad): inexistente en el repositorio y fuera de mi alcance.
- Que el worker del outbox corra en producción como proceso permanente; la revisión D12 de M22 dice que `package.json` expone `outbox:worker` y que el bucle existe, pero no comprobé un despliegue.
- Si `pg_cron` o `pg-boss` pueden instalarse en la instancia Supabase/PostgreSQL local (no consulté la base).
- La licencia del repositorio de `pg-boss` (solo leí el campo del registro npm).
- La viabilidad de una pasarela Azul/Cardnet con licencia de comercio (no investigada; requiere contrato con el adquirente).
- Cómo se trata fiscalmente el apartado (anticipo vs. depósito en garantía): M22 lo deja al contador (S-22-01).
- Alcance exacto del cambio al cierre (`cierre.ts`) respecto a la ficha M03 en READY: hay que enmendar M03 antes del lote RS-L7.
