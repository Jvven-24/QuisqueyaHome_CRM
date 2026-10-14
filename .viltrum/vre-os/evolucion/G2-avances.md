# Expediente de evolución · Avances de obra (M05: fases, fotos, 360, boletín)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21+D03+D05, grupo G2, 14-oct-2026. Solo lectura de `src/` y web.
> Reglas: misma tecnología primero. Copiar o portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia). AGPL/GPL solo RUN o referencia. Nada se incrusta; todo por puertos y outbox.
> Evidencia: `archivo:línea` leído hoy en el código; «registro npm» y LICENSE leídos hoy. No repite el inventario D21 de 14-oct (se cita) ni `D19-enlace-portal-crm` (hueco 15: la publicación de avance no llega al Portal).

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 2 | Fases por proyecto (crear plantilla de 8 o una a una), editar estado, %, nota pública, responsable, video de YouTube, publicar, subir y borrar fotos (`src/application/proyectos/casos-de-uso.ts:206-389`; `avances/vista.tsx`). Sin 360, sin hitos, sin boletín, sin alertas. |
| Datos reales y reglas de negocio | 2 | `construction_phases` y `files` (`schema.ts:526-560`, `1056-1074`). El % del proyecto es el promedio simple de las fases (`domain/avance-obra.ts:18-22`) sin pesos; sin reglas entre estado, % y publicación (`api/proyectos/[id]/fases/[faseId]/route.ts:13-33`). |
| Diseño y componentes | 2 | Selector de fase, editor y panel «Evidencia» con `<img>` a tamaño original (`avances/vista.tsx:229`); sin línea de tiempo visual, sin visor. |
| Experiencia de uso (flujos, atajos, móvil) | 2 | Subir fotos con un `input[type=file]` (`vista.tsx:243-252`); sin cámara directa, sin progreso, sin reintento; pensado para escritorio. |
| Calidad (pruebas, seis estados, accesibilidad) | 2 | Pruebas de casos de uso y de dominio (`casos-de-uso.test.ts`, `avance-obra.test.ts`). Sin `error.tsx`/`loading.tsx` del módulo (verificado hoy); subida real de extremo a extremo UNKNOWN (crm-mapa-modulos M05 lo marca como «dataset local vacío»). |

Objetivo de este programa: 4.

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **El tipo de archivo lo declara el cliente.** `fotos/route.ts:48` pasa `archivo.type` como `tipoMime`; `validarFoto` (`domain/avance-obra.ts:78-82`) solo compara ese texto con la lista permitida y el tamaño. Nadie lee los primeros bytes. Escenario: un HTML o un ejecutable renombrado con `Content-Type: image/png` se sube al bucket y se sirve con URL firmada, además con el tipo falso. Remedio: sniff de contenido (`file-type`, MIT) y re-codificación (`sharp`, Apache-2.0) antes de guardar.
2. **El límite de 25 MB depende de una cabecera opcional.** `fotos/route.ts:25` lee `content-length`; si falta (transferencia en trozos), la comprobación vale 0 y `request.formData()` carga todo en memoria antes de `validarFoto`. Escenario: un archivo grande consume memoria del servidor aunque luego se rechace.
3. **Las fotos del iPhone probablemente se rechazan.** La interfaz ofrece `accept="image/*"` (`vista.tsx:245`) pero el servidor solo acepta JPEG, PNG, WEBP y GIF (`avance-obra.ts:64-69`). Una foto HEIC producirá «Solo se permiten imágenes JPEG…» sin explicar cómo arreglarlo. (Hipótesis: la conversión automática de iOS depende del ajuste del teléfono y del `accept`; no la probé en un dispositivo.)
4. **Borrar una fase la elimina de verdad.** `repos/proyectos.ts:158-161` hace `DELETE FROM construction_phases`, mientras las fotos solo se marcan con `deleted_at`; los objetos del bucket quedan huérfanos. Contradice «nada se elimina» (D-10) y destruye el historial de publicación que el comprador ya vio. Remedio: archivar con motivo.
5. **Toda foto se guarda con `visibility: "public"`** (`casos-de-uso.ts:342`) aunque la fase no esté publicada. Hoy no filtra nada porque se sirve con URL firmada de 1 h (`avances/page.tsx:126-131`), pero cuando el Portal lea `files` esa marca contradice a `is_published`. Remedio: la visibilidad se deriva de la publicación de la fase.
6. **La cuadrícula descarga el original de cada foto** (`vista.tsx:229`, hasta 10 MB cada una, sin miniatura ni carga diferida). En 4G de una obra, una fase con 30 fotos es inutilizable.
7. **Orden y contexto de las fotos inexistentes**: `position: 0` para todas (`casos-de-uso.ts:343`), sin leyenda, sin fecha de toma, sin zona. El comprador recibirá una pila sin sentido.
8. **El porcentaje que ve el comprador puede ser incoherente.** Zod acepta fase `completed` con 0 % o publicada sin foto ni nota; el avance del proyecto es el promedio simple (`avance-obra.ts:18`), de modo que «Entrega» pesa igual que «Cimientos». Ese número alimenta `projects.progress_percent`, la tarjeta de Propiedades y el futuro cobro por hitos (A7.6).
9. **Publicar es una marca sin efecto.** `isPublished`/`publishedAt` se guardan, pero no se emite evento ni el Portal lo recibe (`D19-enlace-portal-crm` hueco 15; decisión #34). La interfaz promete «El comprador verá la nota, el porcentaje y las fotografías en el portal público» (`vista.tsx`, texto del panel) sin que exista el enlace: **afirmación falsa en la UI**.
10. **Capas y estados**: `avances/page.tsx` llama a `adminClient()` (clave de servicio) y a `getDb()` directamente (`page.tsx:22,126`) en vez de pasar por `AlmacenamientoArchivos` y una consulta; sin `error.tsx`/`loading.tsx`.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| AV-01 | Plantillas de fases configurables (por tipo de proyecto) con **peso** por fase y fechas previstas; reemplazan la constante `FASES_ESTANDAR` | ESENCIAL | A15.1 | Constante (`avance-obra.ts:42-51`) |
| AV-02 | Avance ponderado y reglas de coherencia (completada = 100 %, publicar exige nota y al menos una foto, retraso calculado contra fecha prevista) | ESENCIAL | A15.1 | Promedio simple, sin reglas |
| AV-03 | Subida de fotos desde el móvil: cámara, varias a la vez, compresión en cliente, cola con reintento y progreso; validación real del contenido; HEIC/JPEG | ESENCIAL | A15.1 | `input` simple, MIME del cliente |
| AV-04 | Miniaturas y marcador de posición generados al subir; cuadrícula con carga diferida; orden manual, portada, leyenda, fecha de toma | ESENCIAL | A15.1 | Original sin orden |
| AV-05 | Archivar fase y foto con motivo (nada se elimina) | ESENCIAL | A19 / D-10 | Borrado físico de fase |
| AV-06 | Publicación con vista previa «así lo verá el comprador», aprobación y evento `AvancePublicado` al Portal y a Client Room | ESENCIAL | A9.1, A2.7 | Marca sin efecto |
| AV-07 | Línea de tiempo del proyecto (fases en barras, retraso resaltado) y visión multi-proyecto | IMPORTANTE | A15.1, A13 | Selector de fase |
| AV-08 | Visor de fotos con ampliación y teclado; comparador antes/después del mismo punto de vista | IMPORTANTE | A15.1 | `<img>` |
| AV-09 | Recorrido 360 por fase/zona (marcadores, escena siguiente) | IMPORTANTE | A3.8 | Solo `videoUrl` de YouTube |
| AV-10 | **Hitos de obra → cobro**: al completar una fase marcada como hito emite `FaseCompletada`; Cobros (M22) la consume para disparar la cuota (hoy fuera de M22) | IMPORTANTE | A7.6 | No existe |
| AV-11 | Boletín fotográfico de avance a compradores del proyecto (correo/WhatsApp) con plantilla y consentimiento | IMPORTANTE | A2.7 | No existe |
| AV-12 | Alertas de fase retrasada o sin actualización (tarea al responsable, KPI en Inicio) | IMPORTANTE | A2.5 | No existe |
| AV-13 | Secuencia cronológica tipo time-lapse por punto de vista | DESEABLE | — | No existe |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| Photo Sphere Viewer | `mistic100/Photo-Sphere-Viewer` @ `44bf27c4bf41` (1-oct-2026); npm `@photo-sphere-viewer/core@5.15.1` | MIT (`LICENSE` leído: © 2014-2015 J. Heleine, 2016-2026 D. Sorel) | TypeScript | `Viewer` + `@photo-sphere-viewer/markers-plugin`, `virtual-tour-plugin` (escenas enlazadas), `gallery-plugin` y `autorotate-plugin` (todos 5.15.1, MIT, registro npm) → AV-09 | APP | Componente cliente con `useEffect`; sin `window` en servidor | M |
| Pannellum | `mpetroff/pannellum` @ `99f4afd686e8`; npm `2.5.7` (19-feb-2026) | MIT (`COPYING` leído) | JavaScript | Visor 360 mínimo si no se necesitan recorridos | APP (alterno) | Sin tipos TS; ya listado en el mapa OSS | S |
| yet-another-react-lightbox | `igordanchenko/yet-another-react-lightbox` @ `dd26692337ad`; npm `3.32.2` (30-jul-2026) | MIT (`LICENSE` leído) | TypeScript | `Lightbox` + plugins Zoom, Thumbnails, Captions, Counter → AV-08 | APP | Peers React 16–19; teclado y foco incluidos | S |
| react-photo-album | `igordanchenko/react-photo-album` @ `8a50416d9747`; npm `3.6.1` | MIT (`LICENSE` leído) | TypeScript | `RowsPhotoAlbum`/`MasonryPhotoAlbum` para la cuadrícula de la fase (AV-04) | APP | Pares con next/image mediante `render.photo` | S |
| react-compare-slider | npm `react-compare-slider@4.0.0` (20-mar-2026) | MIT (registro npm) | TypeScript | `ReactCompareSlider` para antes/después (AV-08) | APP | React ≥16.8 | S |
| Uppy | `transloadit/uppy` @ `2f8e49b3aadc` (14-oct-2026); npm `@uppy/core@6.2.0` | MIT (`LICENSE` leído) | TypeScript | `@uppy/dashboard`, `@uppy/compressor@4.0.0`, `@uppy/image-editor@5.0.0`, `@uppy/xhr-upload@6.0.1` (cola, progreso, reintento, compresión) → AV-03 | APP | `@uppy/react@6` existe; Dashboard pesa más que react-dropzone | M |
| Uppy + TUS (resumible) | `@uppy/tus@6.0.0`; guía oficial de Supabase Storage «Resumable Uploads» (recomienda >6 MB y redes inestables, nombra a Uppy) | MIT | TypeScript | Subida resumible directa a Supabase Storage | APP (spike) | **Choca con nuestro modelo**: hoy el bucket es privado y solo el servidor escribe con clave de servicio (`proyectosParaEscritura`, `almacenamientoSupabase`); la subida directa del cliente exigiría políticas de Storage o un token emitido por servidor. No verificado (§8) | M–L |
| react-dropzone | `react-dropzone/react-dropzone` @ `72f30273d3c5`; npm `20.1.3` (10-oct-2026) | MIT (`LICENSE` leído) | TypeScript | Hook `useDropzone` para arrastrar y soltar, ligero, si se prefiere interfaz propia en vez del Dashboard de Uppy | APP | Compatible React ≥18 | S |
| file-type | `sindresorhus/file-type`; npm `22.1.1` (17-sep-2026) | MIT (registro npm) | TypeScript | `fileTypeFromBuffer` para validar el contenido real (punto crítico 1) | APP | Solo servidor; ESM | S |
| sharp | `lovell/sharp`; npm `0.35.5` (27-sep-2026) | Apache-2.0 (registro npm) | Node nativo | Redimensionar, quitar EXIF, miniaturas y re-codificar a JPEG/WEBP al subir (AV-04) | APP | Binarios para Windows/Linux; **no verifiqué si el binario precompilado abre HEIC** (§8) | M |
| exifr | npm `7.1.3` | MIT (registro npm) | JavaScript | Leer fecha y GPS de la toma (AV-04) | APP (riesgo) | **Sin publicar desde 2021**; solo lectura, aislarlo tras una función | S |
| blurhash / thumbhash | npm `blurhash@2.0.5`, `thumbhash@0.1.1` | MIT (registro npm) | TypeScript/JS | Marcador de posición mientras carga la miniatura (AV-04) | APP | Estables aunque sin cambios desde 2023 | S |
| frappe-gantt | `frappe/gantt`; npm `1.2.2` (25-feb-2026) | MIT (registro npm) | JavaScript | Línea de tiempo de fases (AV-07) | APP | Sin tipos propios verificados; alternativa: barras con CSS Grid propias | M |
| @react-email/components | npm `1.0.12` (9-abr-2026) | MIT (registro npm) | TypeScript | Plantilla del boletín de avance (AV-11), ya prevista en el mapa OSS | APP | React 18/19 | S |
| Immich | AGPLv3 | AGPL | — | Nada (galería de fotos autoalojada) | REF | Ya descartado en `MAPA-SISTEMAS-OSS.md` §7: las fotos de obra van por `AlmacenamientoPort` | — |

**Qué no adaptamos y riesgo.** No se copia código: todo entra como dependencia npm (APP) con versión fijada, así la cabecera de procedencia se reduce a `package.json` + este expediente. Riesgos: `sharp` y la conversión HEIC (binarios nativos); exifr sin mantenimiento; TUS directo cambia el modelo de seguridad (requiere D12). Pannellum y PSV no se instalan los dos: elegir PSV por sus plugins de recorrido (la elección de Pannellum del mapa OSS queda superada por PSV si el equipo quiere escenas enlazadas; Wilber decide).

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Cabecera de proyecto con anillo de avance ponderado, próxima fase y retraso | `Card`, `Badge`, gráfica con `chart.tsx` (shadcn charts ya instalado) | `/avances` |
| Línea de tiempo de fases (barras previstas vs reales) | `frappe-gantt` o CSS Grid propio + `Tooltip` | pestaña Cronograma |
| Detalle de fase en `Sheet`/`Drawer` con pestañas Resumen · Fotos · 360 · Publicación | `Tabs`, `Sheet`, `Drawer` (vaul) | selección de fase |
| Cuadrícula de fotos con arrastrar-para-ordenar | `react-photo-album` + `@dnd-kit/sortable` (MIT, 10.0.0, registro npm) | pestaña Fotos |
| Visor | `yet-another-react-lightbox` con plugins | clic en foto |
| Subida | `Uppy Dashboard` o `react-dropzone` + barra de progreso (`Progress` de shadcn por añadir) | botón «Agregar fotos» |
| Vista previa del comprador | iframe propio no: panel «Así lo verá el comprador» con el mismo componente que usará el Portal | pestaña Publicación |
Seis estados por pestaña; móvil primero (cámara, subida en segundo plano con aviso al salir, objetivos ≥48 px); el texto del panel que promete el Portal se sustituye por el estado real («Publicada · Portal: pendiente de enlace»).

## 6. Comunicación con el resto (centralización)
- **Emite (outbox; requiere `OBX`):** `AvancePublicado` (fase, % del proyecto, ids de fotos; sin URLs firmadas), `FaseCompletada` (con la marca de hito, consumida por Cobros/M22 para A7.6), `FaseRetrasada` (consumida por Tareas/Inicio y Comunicaciones).
- **Consume:** `ProyectoEstadoLegalCambiado` (Propiedades) para no publicar avance de un proyecto sin clasificación aprobada (decisión de Wilber, ver §8); `CompradorAsignado` desde Contratos/Reservas para armar la lista de destinatarios del boletín (AV-11).
- **Puertos:** `AlmacenamientoArchivos` (extender con `urlFirmada` y `crearMiniatura`, quitando `adminClient()` de `page.tsx`), `PortalPort` (I04), `MensajeriaPort` (boletín; la autorización de envío exige el permiso de escritura corregido el 14-oct).
- **Datos que comparte:** `projects.progress_percent` (Propiedades, Reportes, Inicio), `construction_phases` (Cobros por hitos), `files` (Documentos/Client Room: las fotos publicadas se muestran al comprador sin copiar archivos).
- Reglas: nada se elimina (D-10); `construction_phases:view/edit` siguen siendo el permiso; el alcance `own` se hereda del proyecto (decisión #32).

## 7. Lotes asignables
Todos requieren **ficha M05-avances en READY** (no existe aún en `spec/modulos/`). Producción Sonnet (decisión #48), revisión por proveedor distinto.

| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| AV-L1 | Validar el contenido real de la foto (`file-type`) y rechazar tipo falso; límite de tamaño leyendo el flujo, no la cabecera; prueba con un `.html` disfrazado de PNG | `src/domain/avance-obra.ts`, `src/app/api/proyectos/[id]/fases/[faseId]/fotos/route.ts`, pruebas, `package.json` | M05 | Sonnet | D12 + Codex | — (arreglo) |
| AV-L2 | Archivar fase y foto con motivo (sin `DELETE`); migración aditiva `construction_phases.archived_at/_by/_reason`; borrar archivos del bucket solo en limpieza futura | `schema.ts`, `drizzle/00NN_*.sql`, `repos/proyectos.ts`, casos de uso, prueba de guarda de adaptador | M05 | Sonnet (D11) | D12 | — |
| AV-L3 | Módulo de subida compartido `SubidaDeArchivos` (react-dropzone, validación, progreso, reintento) y su prueba de componente; lo reutilizan Documentos y Propiedades | `src/app/(crm)/_ui/subida-archivos.tsx`, pruebas | M05 / DC-0 | Sonnet | D07 + D14 | — |
| AV-L4 | Miniaturas y marcador al subir (`sharp`, `thumbhash`), EXIF de fecha, re-codificación; columnas `files.thumb_url`, `taken_at`, `caption` | `schema.ts`, migración, `src/infrastructure/almacenamiento/*`, caso de uso `subirFotos` | M05 | Sonnet | D12 + Codex | AV-L1, AV-L2 |
| AV-L5 | Cuadrícula con `react-photo-album`, visor `yet-another-react-lightbox`, orden por arrastre (`@dnd-kit`), portada y leyenda | `avances/_fotos.tsx`, `vista.tsx` | M05 | Sonnet | D07 + D14 | AV-L4 |
| AV-L6 | Plantillas de fases con peso y fechas previstas; avance ponderado (`promedioPonderado`) y reglas de coherencia en dominio, con pruebas de bordes | `src/domain/avance-obra.ts`, `schema.ts` (`phase_templates`, `weight`, `planned_start/end`), casos de uso | M05b-plantillas | Sonnet | Codex + D14 | AV-L2 |
| AV-L7 | Pestaña Publicación con vista previa, aprobación y `AvancePublicado` en el outbox (corrige el texto falso de la UI) | UI, casos de uso, evento | M05c-publicar + I04 | Sonnet | D12 | `OBX`, I04 READY |
| AV-L8 | Cronograma de fases (barras, retraso) y tablero multi-proyecto | `avances/_cronograma.tsx`, consulta | M05b | Sonnet | D14 | AV-L6 |
| AV-L9 | Visor 360 con PSV (escenas, marcadores) y carga de panorámicas equirrectangulares | `avances/_360.tsx`, `package.json` | M05d-360 | Sonnet | D07 + Codex | AV-L4 |
| AV-L10 | Antes/después con `react-compare-slider` (dos fotos del mismo punto) | `_comparador.tsx` | M05 | Haiku | D14 | AV-L5 |
| AV-L11 | `FaseCompletada` con marca de hito; contrato de evento y doble para la prueba de Cobros | `src/application/proyectos/eventos.ts`, pruebas de contrato | M05e + M22 | Sonnet | D12 + D14 | `OBX`, M22-L7 |
| AV-L12 | Boletín de avance (`@react-email`) y selección de destinatarios; envío por `MensajeriaPort` con consentimiento | `src/infrastructure/correo/plantillas/avance.tsx`, caso de uso | M05f-boletin | Sonnet | D12 | AV-L7, M11 |
| AV-L13 | `error.tsx`, `loading.tsx` y consulta fuera de `page.tsx`; urlFirmada por puerto | `avances/**`, `almacenamiento.ts` | M05 | Haiku | D14 | — |
| AV-L14 | Spike TUS resumible: informe D12 con 2 opciones (token emitido por servidor vs políticas de Storage) y prueba con un archivo de 40 MB en red lenta simulada | solo informe + prototipo aislado en `scripts/` | M05g | Sonnet | D12 | AV-L3 |

## 8. No verificado
- Que una foto HEIC de iPhone llegue como HEIC al servidor con `accept="image/*"` (depende del ajuste «Más compatible» del teléfono). No probé en dispositivo.
- Que el binario precompilado de `sharp` decodifique HEIC en Windows/Linux; y la ruta a seguir si no (convertir en cliente con una librería con licencia permisiva; `heic-to` es LGPL-3.0 según el registro, así que **no** se porta).
- Modelo de seguridad de TUS directo con bucket privado y subidas hechas hoy solo por servidor (no hallé la sección de la documentación que describe tokens firmados para resumibles; la búsqueda solo confirmó que existe el protocolo y la mención a Uppy).
- Si la subida actual de extremo a extremo funciona en el entorno local (crm-mapa-modulos M05: «subida end-to-end UNKNOWN»).
- Política legal: ¿se puede publicar avance de un proyecto con clasificación Confotur pendiente? No es técnica; la decide Wilber con el abogado.
- Rendimiento real de `frappe-gantt` con React 19 (no tiene tipos verificados); si falla, CSS Grid propio.
