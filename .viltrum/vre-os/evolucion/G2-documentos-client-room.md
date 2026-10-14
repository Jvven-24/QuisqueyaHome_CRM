# Expediente de evolución · Documentos y Client Room (M18; base de documentos para M19 Deal Room)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21+D03+D05, grupo G2, 14-oct-2026. Solo lectura de `src/` y web.
> Reglas: misma tecnología primero. Copiar o portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia). AGPL/GPL solo RUN o referencia. Nada se incrusta.
> **Dos piezas en un expediente porque comparten datos:** (1) **Documentos**, el repositorio con versiones, lista por etapa, caducidad y lectura rastreada, que es del CRM; (2) **Client Room**, la vista del comprador, que **no puede vivir en el CRM** por la decisión D-08 («Cliente fuera del CRM»: sin autenticación de comprador ni enlace interno compartido, `M03-negocios.md` REQ-03-07) y por tanto se construye como una proyección que el CRM publica hacia el **Portal**, que ya tiene cuentas de cliente. Nivel actual: Documentos 1, Client Room 0.
> Se apoya en lo ya hecho y no lo repite: `research/D19-enlace-portal-crm-2026-10-14.md` §5 (identidades), `spec/integraciones/I04-portal.md` (PortalPort, lista blanca, revisión) y `PLAN-INTEGRAL` §5.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 1 | Tabla polimórfica `files` (`schema.ts:1056-1074`) que hoy solo guarda fotos de obra (inventario D21: «`files` solo guarda fotos, sin documentos»). Sin pantalla de documentos. Client Room: no existe (`crm-mapa-modulos` M18: «Sin página dedicada localizada»; D19 §5). |
| Datos reales y reglas de negocio | 1 | `files` tiene `entity_type/entity_id`, MIME, tamaño, `visibility` (`internal|public`), `deleted_at`; **sin versión, sin hash, sin tipo documental, sin vencimiento, sin nivel de confidencialidad**. Lista permitida solo de imágenes (`domain/avance-obra.ts:64-69`). `ENTITY_TYPES` (`catalogs.ts:61-80`) incluye `file` pero no `document`. |
| Diseño y componentes | 0 | Sin interfaz. |
| Experiencia de uso | 0 | Sin flujo de documentos ni área del cliente. |
| Calidad | 1 | Subida de fotos probada a nivel de caso de uso (`casos-de-uso.test.ts`); nada de documentos sensibles. |

Objetivo: 4 en Documentos; Client Room 3–4 (según el avance del Portal, que es otro repositorio).

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **El único almacenamiento es el bucket de fotos de obra** (`contenedor/proyectos.ts:10`: `almacenamientoSupabase("avances-obra")`) y su validador solo admite JPEG/PNG/WEBP/GIF. Documentos de identidad, contratos y comprobantes de pago **no deben compartir bucket** con fotos que algún día se publican; necesitan bucket y políticas propias, cifrado y nivel de confidencialidad.
2. **No hay datos de identidad del comprador en ninguna parte** (ver Contratos §2.2): cédula/pasaporte, nacionalidad, domicilio. Cuando se carguen, la tabla debe ser restringida y tener auditoría de **lectura** (A19.3); hoy `audit_log` registra escrituras de casos de uso, no consultas.
3. **Sin validación del contenido real de los archivos** (el MIME lo declara el cliente; mismo defecto que Avances, `fotos/route.ts:48`). Para PDF y Office el riesgo es mayor (macros, JavaScript embebido). Hace falta lectura de firma de archivo y, si se acepta carga del cliente desde el Portal, análisis antimalware.
4. **El Client Room no tiene identidad a la cual colgarse.** El Portal tiene `client_accounts`, `client_profiles` y sesiones propias (D19 §5), pero **no hay vínculo cliente ↔ contacto del CRM** (el CRM deduplica por teléfono/correo, el Portal no envía identificador de cuenta) y las cuentas de comprador están detrás de la doctrina H3 (aprobación antes de activarlas; el generador de release declara `buyer_accounts: False`, pero el router se monta sin condición, `server.mjs:16,139-144`). Sin un vínculo verificado, mostrar un estado de cuenta a la persona equivocada es la falla más grave posible.
5. **Papermark no encaja con el mandato local.** Leí su LICENSE (AGPLv3 con carpeta `ee/` comercial), su `package.json` (Next 14, Prisma, `@upstash/redis`, `@trigger.dev/sdk`, `@vercel/blob`) y su README (Tinybird para analítica, Resend para correo, S3 o Vercel Blob): son servicios en la nube que contradicen «investigación e integración solo local». Último commit 28-ago-2026. Conclusión: **no se instala**; se construye una versión mínima propia de «enlace con seguimiento de lectura» (ver DC-05).
6. **Sin lista documental por etapa.** No existe el concepto «qué documentos faltan para reservar / firmar / entregar» (A17.2). El único checklist del código es el de Academy (`academy_checklist_items`). Sin él, el contrato se firma con expedientes incompletos.
7. **Borrado y retención**: `files.deleted_at` permite ocultar; el catálogo D21 (A18.7) cita 10 años de conservación para PLAFT (fuente secundaria) y D-10 prohíbe borrar. La política de retención y de purga a pedido del titular (protección de datos) no está definida; el Portal ya implementa «exportación y purga» de su cuenta (D19 §5) sin propagarse al CRM.
8. **Afirmación pendiente en la interfaz de Avances**: promete al comprador el portal público (`avances/vista.tsx`), que no está enlazado; el Client Room es lo que lo haría verdad (ver `G2-avances.md` punto 9).

## 3. Funciones objetivo de nivel avanzado
### Documentos (CRM)
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| DC-01 | Repositorio por entidad (proyecto, unidad, contacto, negocio, reserva, contrato, renta) con tipo documental, **versiones inmutables**, hash SHA-256 y confidencialidad (interno, restringido, compartible con el cliente) | ESENCIAL | A17.1 | `files` sin versión |
| DC-02 | **Lista documental por etapa**: qué falta, quién lo debe y desde cuándo; semáforo en Negocios, Reservas y Contratos | ESENCIAL | A17.2 | No existe |
| DC-03 | Subida segura: validación por contenido, límites por tipo, bucket privado propio, miniatura de PDF, antimalware opcional | ESENCIAL | A17.1 | Solo fotos |
| DC-04 | Visor integrado de PDF e imágenes (sin descargar), descarga controlada y auditada, marca de agua en copias compartidas | ESENCIAL | A17.1 | No existe |
| DC-05 | **Enlace de lectura rastreada**: token con expiración, máximo de vistas, revocación; registro de aperturas y tiempo (sin Papermark) | IMPORTANTE | A17.1 | No existe |
| DC-06 | Caducidad con aviso (pasaporte, cédula, certificados Confotur, permisos de obra, seguros) | IMPORTANTE | A17.3 | No existe |
| DC-07 | Auditoría de lectura de documentos sensibles (quién abrió qué y cuándo) | IMPORTANTE | A19.3 | No existe |
| DC-08 | Solicitud de documentos al cliente (WhatsApp/correo) con enlace de subida seguro y revisión: recibido, verificado, rechazado con motivo | IMPORTANTE | A17.2 | No existe |
| DC-09 | Dossier de proyecto para brokers e inversores (brochure, planos, disponibilidad, Confotur) con seguimiento de lectura | IMPORTANTE | A10.3 | No existe |
| DC-10 | Extracción asistida de datos de cédula/pasaporte (MRZ + OCR) siempre con revisión humana | DESEABLE | A17.4 | No existe |
| DC-11 | Búsqueda por nombre, tipo, entidad y etiquetas; papelera con restauración (patrón de `/configuracion`) | IMPORTANTE | G02 | No existe |

### Client Room (Portal, alimentado por el CRM)
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| CR-01 | **Vista del comprador por unidad**: estado de cuenta (cuotas, pagos, recibos PDF, saldo, próxima cuota), contrato firmado, documentos compartidos, avance de obra publicado con fotos, fecha estimada de entrega, contacto del asesor | ESENCIAL | A9.1, A9.2 | No existe |
| CR-02 | Acceso con cuenta del Portal **vinculada a un contacto verificado** (código por correo o teléfono, no solo coincidencia de datos), doble factor, ES/EN, huso horario de la diáspora | ESENCIAL | A9.4 | Cuentas del Portal sin vínculo |
| CR-03 | Revocación inmediata del acceso y registro de lecturas | ESENCIAL | A9.4 | No existe |
| CR-04 | Subir documentos desde el Client Room (cédula/pasaporte, comprobante de pago) hacia la revisión del CRM | IMPORTANTE | A17.2 | No existe |
| CR-05 | Solicitudes del cliente (postventa, cambio de datos, pedir un documento) que crean tareas en el CRM | IMPORTANTE | A9.3 | No existe |
| CR-06 | Avisos al cliente: cuota por vencer, avance publicado, documento listo (WhatsApp/correo, con consentimiento) | IMPORTANTE | A2.1 | No existe |
| CR-07 | Acuse de lectura/aceptación de un documento (sin valor de firma legal) | DESEABLE | A9.3 | No existe |
| CR-08 | Deal Room: sala compartida para comprador, abogado y broker alrededor de un contrato | DESEABLE | M19 | No existe |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| react-pdf (visor, de wojtekmaj) + pdf.js | npm `react-pdf@11.0.0` (10-sep-2026), `pdfjs-dist@6.4.299` (3-oct-2026) | MIT / Apache-2.0 (registro npm) | TypeScript/React 19 | Componentes `Document/Page` para el visor de PDF dentro del CRM y del Client Room (DC-04, CR-01); peers declaran React 19 | APP | Requiere servir el worker de pdf.js desde la propia app; probar con Next 15 | M |
| @react-pdf/renderer | `diegomura/react-pdf` @ `e7b14db1e53d`; `4.9.0` | MIT (`LICENSE` leído) | TypeScript | **Generar** recibos y estados de cuenta del Client Room (reutiliza la base de PDF) | APP | Ver Cotizaciones | S |
| file-type | npm `22.1.1` | MIT (registro npm) | TypeScript | Validar el contenido real de PDF/imagen/Office antes de guardar (DC-03) | APP | Ver Avances AV-L1 | S |
| sharp | npm `0.35.5` | Apache-2.0 (registro npm) | Node nativo | Miniaturas de imágenes (la miniatura de la primera página de un PDF necesita otra pieza; **no verificada**) | APP | — | M |
| Uppy / react-dropzone | `transloadit/uppy` @ `2f8e49b3aadc`; `react-dropzone/react-dropzone` @ `72f30273d3c5` | MIT (`LICENSE` leídos) | TypeScript | Módulo de subida compartido (AV-L3) | APP | Ver Avances | S |
| tesseract.js | npm `7.0.0` (dic-2025) | Apache-2.0 (registro npm) | JavaScript/WASM | OCR en el navegador o en el servidor para cédulas (DC-10) | APP (opcional) | Peso alto; el OCR en español de documentos de identidad requiere datos de idioma (no verificado) | M |
| mrz | npm `5.0.2` (11-mar-2026) | MIT (registro npm) | JavaScript | Analizar la zona legible por máquina del pasaporte (DC-10); no necesita OCR si se teclea | APP | Entrada de texto + validación de dígitos de control | S |
| signature_pad | npm `5.1.4` | MIT (registro npm) | TypeScript | Acuse manuscrito en tableta (CR-07), **no** firma legal | APP | — | S |
| @cantoo/pdf-lib | npm `2.11.1` (15-sep-2026) | MIT (registro npm) | TypeScript | Marca de agua en copias compartidas (DC-04, DC-05) | APP | Fork activo de `pdf-lib` | M |
| qrcode | npm `1.5.4` | MIT (registro npm) | JavaScript | QR en recibos hacia la verificación en el Client Room | APP | — | S |
| **Papermark** | `mfts/papermark` (rama `main`; último commit 28-ago-2026) | **AGPLv3**, carpeta `ee/` y `app/(ee)` bajo licencia comercial (`LICENSE` leído) | Next.js 14, Prisma, Tinybird, Resend, Upstash, Trigger.dev, S3/Vercel Blob | Ideas: seguimiento por página, caducidad del enlace, NDA, marca de agua | REF / RUN solo si Wilber acepta servicios en la nube | **Descartado como RUN** por dependencias en la nube; no se copia código | — |
| ClamAV | — | GPL-2.0 (**no leí su LICENSE**) | C | Escáner antimalware como servicio local (`clamd`) detrás de un puerto | RUN (opcional) | Operación y memoria en la VPS: decisión D16 | M |
| Documenso | — | — | — | Excluido por Wilber | — | — | — |
| Paperless-ngx | — | GPL-3.0 (**no verificado en esta pasada**) | Python | Archivo documental con OCR | REF | Duplicaría el repositorio del CRM | — |

**Qué no adaptamos.** No se copia código de un gestor documental completo: lo que el negocio necesita (versiones, lista por etapa, enlaces con seguimiento, visor) son tablas, reglas y pantallas nuestras sobre `files` y Supabase Storage, ya en la pila. **Riesgos:** pdf.js y el worker en Next; miniaturas de PDF; OCR de documentos de identidad (calidad y privacidad); y, para Client Room, el trabajo del lado Portal que no controla este repositorio.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Panel «Documentos» reutilizable por entidad (proyecto, contacto, negocio, contrato) | Componente `PanelDocumentos` con `Tabs` (Todos · Faltan · Por vencer), `data-table.tsx`, `Badge` de estado; acción primaria «Subir» | fichas de Propiedades, Contactos, Negocios, Contratos, Rentas |
| Lista documental por etapa con semáforo | Lista con casillas de estado (pendiente, recibido, verificado, rechazado) y responsable; resumen «3 de 8» en cabeceras | Negocios, Reservas, Contratos |
| Visor | `Dialog` a pantalla completa con `react-pdf`, zoom y teclado; marca de agua en copias | todo |
| Enlace rastreado | Diálogo «Compartir» con caducidad, vistas máximas y copia de enlace; registro de aperturas en la ficha | detalle de documento |
| Subida | Módulo `SubidaDeArchivos` (AV-L3) con progreso y reintento | todo |
| Client Room (en el Portal) | Página `/perfil/mi-unidad`: cabecera con unidad y avance, tarjetas «Pagos», «Documentos», «Obra», «Mi asesor»; mismas reglas de tokens (`docs/DESIGN.md`) | Portal |
| Seis estados | Todos los paneles; sin conexión: solo lectura | todo |
En el Client Room, **cifras en la moneda del plan, nunca sumadas**, fechas con huso horario del cliente y de Santo Domingo, textos en español e inglés; ningún dato interno (comisión, precio real, notas internas, nombre de otros compradores) en ningún DTO.

## 6. Comunicación con el resto (centralización)
- **Documentos es dueño de las tablas** `documents`, `document_versions`, `document_requirements` (lista por etapa), `document_shares` (token, expiración, revocación), `document_views`. Los demás módulos **enlazan** (`entity_type/entity_id`) y no crean sus propios archivos: Contratos (PDF emitido y firmado), Reservas (formulario y comprobante), Cobros (comprobantes, recibos), Rentas (inspecciones, contratos), Avances (fotos publicadas se referencian, no se copian), Propiedades (planos, brochure, permisos).
- **Emite (outbox, `OBX`):** `DocumentoRecibido`, `DocumentoVerificado`, `DocumentoRechazado`, `DocumentoPorVencer`, `DocumentoCompartido`, `ClientRoomActualizado` (paquete del cliente cambió).
- **Consume:** `ContratoFirmado`, `PagoRegistrado/PagoAnulado` (M22), `AvancePublicado`, `ReservaConvertida`, `ContratoRescindido` (revocar acceso), `ProyectoEstadoLegalCambiado`.
- **Puertos:** `DocumentosPort` (interno), `AlmacenamientoArchivos` (extendido con bucket por clasificación y URL firmada), `PortalPort` ampliado con `ClientRoomPort` (propuesta): `publicarPaqueteCliente`, `revocarAcceso`, `salud`; misma regla de I04: lista blanca campo a campo, revisión monótona, firma HMAC, idempotencia, el CRM es la autoridad. **El Portal solo recibe lo que se publica, nunca consulta al CRM.**
- **Identidad (decisión necesaria):** el vínculo cuenta del Portal ↔ contacto lo origina el CRM (invitación al comprador con enlace de un solo uso) y el Portal confirma con código; se guarda en `external_refs(entity_type='contact', system='portal')`. Hasta que Wilber/Ismael levanten la doctrina H3, el Client Room no se activa.
- **Permisos (propuesta):** recurso `documents` (`view|create|edit|export`) con alcance heredado de la entidad; `document_confidential` (KYC, contratos) con permiso propio y auditoría de lectura; el broker ve solo documentos `compartible` de sus clientes.

## 7. Lotes asignables
Todos requieren **ficha M18-documentos (CRM) y M18b-clientroom (CRM + Portal) en READY** (no existen). Los lotes marcados «Portal» se ejecutan en el repositorio `QuisqueyaHome PortalWeb` por su responsable; aquí solo se define el contrato. `OBX` = cola del outbox filtrada por tipo.

| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| DC-L1 | Dominio puro: tipos documentales, estados, caducidad, evaluación de la lista por etapa («faltan X»), niveles de confidencialidad; pruebas | `src/domain/documentos.ts`, `.test.ts` | M18 | Sonnet | Codex | — |
| DC-L2 | Esquema: `documents`, `document_versions`, `document_requirements`, `document_shares`, `document_views`; RLS; FK RESTRICT; hash único por versión; recursos de permisos | `schema.ts`, `drizzle/00NN_*.sql`, `catalogs.ts` | M18 (datos) | Sonnet (D11) | D12 + D14 | DC-L1 |
| DC-L3 | Puerto de almacenamiento ampliado (bucket por clasificación, URL firmada corta, subida con validación por contenido); bucket privado `documentos` distinto del de fotos | `src/application/compartido/almacenamiento.ts`, `src/infrastructure/almacenamiento/*`, `contenedor/*` | M18 | Sonnet | D12 | AV-L1 |
| DC-L4 | Casos de uso: subir, nueva versión, verificar/rechazar con motivo, archivar (sin borrar), solicitar, listar con alcance | `src/application/documentos/**` | M18 | Sonnet | D12 + Codex | DC-L2, DC-L3 |
| DC-L5 | Lectura rastreada y auditoría de lectura: `document_views`, auditoría de lecturas sensibles; prueba de que abrir un documento restringido deja registro | casos de uso, repositorio | M18 | Sonnet | D12 | DC-L4 |
| DC-L6 | Rutas `api/documentos/**` (Zod estricto, alcance, `:id`) y pruebas de seguridad; descarga con URL firmada de 60 s | `src/app/api/documentos/**`, pruebas | M18 | Sonnet | D12 | DC-L4 |
| DC-L7 | `PanelDocumentos` reutilizable + visor `react-pdf` + módulo de subida; integrado en la ficha de Contactos y de Propiedades | `src/app/(crm)/_ui/panel-documentos.tsx`, vistas | M18 | Sonnet | D07 + D14 | DC-L6, AV-L3 |
| DC-L8 | Lista documental por etapa en Negocios/Reservas/Contratos (semáforo y bloqueo opcional) | consultas, UI de esos módulos (con sus fichas) | M18 + M03/M17/M23 | Sonnet | D14 | DC-L7 |
| DC-L9 | Enlaces con caducidad, vistas máximas y revocación + marca de agua con `@cantoo/pdf-lib` | `documentos/compartir.ts`, UI | M18b | Sonnet | D12 | DC-L5 |
| DC-L10 | Caducidad y avisos: barrido en el worker, evento, tareas | `documentos/vencimientos.ts` | M18 | Haiku | D12 | DC-L4, `OBX`, RS-L10 |
| DC-L11 | Solicitud de documentos al cliente (plantilla, enlace de subida de un solo uso, revisión) | casos de uso, UI | M18c | Sonnet | D12 | DC-L9, M11 |
| DC-L12 | OCR/MRZ de cédula y pasaporte con revisión humana (spike primero) | `src/application/documentos/identidad.ts` | M18d | Sonnet | D12 | CT-L3 |
| CR-L1 | Contrato de datos del paquete del cliente (JSON con lista blanca, revisión monótona), Zod, doble en memoria y prueba que garantiza que no contiene precio real, comisión, notas internas ni otros compradores | `src/application/compartido/client-room.ts`, pruebas de contrato | M18b + I04 | Sonnet | D12 | I04 READY |
| CR-L2 | Proyector `armarPaqueteCliente` (consulta de M22 + Documentos + Avances publicados) y evento `ClientRoomActualizado` | `src/application/clientroom/**` | M18b | Sonnet | D12 + Codex | CR-L1, M22-L8, DC-L4, `OBX` |
| CR-L3 | Vínculo contacto ↔ cuenta del Portal con invitación de un solo uso y revocación; tabla `external_refs` | esquema, casos de uso | M18b | Sonnet (D11) | D12 | CR-L1; levantamiento H3 |
| CR-L4 | **Portal:** receptor firmado del paquete, páginas `/perfil/mi-unidad`, bandera de runtime, doble factor, ES/EN | repo del Portal | (ficha del Portal) | Sonnet | D12 + D14 | CR-L1, CR-L3 |
| CR-L5 | **Portal:** subida de documentos del cliente hacia el CRM (receptor del CRM con HMAC, antimalware, cola de revisión) | repo del Portal + `src/app/api/portal/documentos/**` | M18c | Sonnet | D12 | CR-L4, DC-L11 |
| CR-L6 | Solicitudes del cliente → tareas del CRM | casos de uso | M18b | Haiku | D14 | CR-L4 |
| CR-L7 | Avisos al cliente (cuota por vencer, avance, documento) por `MensajeriaPort` con consentimiento | casos de uso | M18b | Sonnet | D12 | CR-L2, M11 |

## 8. No verificado
- Si el Portal acepta hoy un receptor interno firmado y si su equipo/ritmo permite el Client Room (es otro repositorio; leí solo el informe D19).
- Cómo se genera la miniatura de la primera página de un PDF con una librería permisiva (no investigué; candidatos: pdf.js en servidor o `sharp` con soporte de PDF dependiente del binario).
- Que el worker de pdf.js funcione con Next 15 sin configuración adicional.
- Licencia exacta de ClamAV y viabilidad operativa local (no leí el LICENSE). Licencia de Paperless-ngx (no verificada).
- Requisitos legales de conservación (10 años según fuente secundaria), protección de datos personales de la Ley 172-13 y RGPD para compradores de la UE: no investigados.
- Calidad del OCR en español sobre cédulas dominicanas y pasaportes extranjeros (no probado).
- Decisión de Wilber sobre D-08: asumo que un **Portal con cuentas de cliente fuera del CRM** cumple la regla (el comprador no entra al CRM); no hay texto firmado que lo diga expresamente.
- Si la cuenta del Portal debe poder subir archivos (superficie de ataque adicional): decisión de seguridad pendiente de D12.
