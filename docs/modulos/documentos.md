# Documentos

## Propósito
Expediente documental de cada negocio: contratos y versiones, sobres de firma y revisión KYC. Hoy todo es vista previa con datos ficticios (`ExpedientesPrevia`). El compendio no lo define como alcance inicial. La auditoría de 27/10/2026 lo marca como riesgo alto porque Tareas promete un enlace seguro para la Ley 155-17.

Buenas prácticas de industria en República Dominicana (validar con asesoría legal):
- Repositorio privado con URLs firmadas de vida corta. Nunca un bucket público.
- Versiones inmutables con hash SHA-256. Un documento usado en una operación no se sobrescribe.
- Firma electrónica con evidencia verificable: identidad del firmante, sello de tiempo y certificado (marco de la Ley 126-02 de comercio electrónico y firma digital).
- KYC y debida diligencia para operaciones inmobiliarias según la Ley 155-17 (lavado de activos). Revisar si la empresa es sujeto obligado.
- Consentimiento y retención de datos personales según la Ley 172-13.
- KYC separado del resto del expediente, con acceso restringido y política de retención aprobada.

## Roles y permisos
Hoy las tres páginas exigen `deals:view`. Es un permiso provisional: el recurso no es el correcto y, con `own`, un broker vería la pantalla KYC de ejemplo. Con datos reales eso sería una fuga.

Propuesta: recursos propios `documents`, `signatures` y `kyc`. Hoy no existen en `PERMISSION_RESOURCES`.

- **Admin**: `all` en los tres. Revisa KYC y aprueba retención.
- **Gerente** (`manager`): `team` en documentos de su equipo. Sin KYC.
- **Broker** (`broker`): `own` en sus negocios. Carga y consulta. Sin KYC ni firma de sobres ajenos.
- **Asistente** (`assistant`): carga y consulta en expedientes autorizados. Sin KYC ni firma.
- Revisión de documentos y firmas exige `create` o `edit`. Descargar un archivo requiere `export`, con auditoría.

## Flujos principales
1. El usuario abre Documentos y la página verifica `deals:view`.
2. Filtra por tipo (Contrato o KYC) y busca en nombre y contexto.
3. Abre "Versiones y detalle". Hoy muestra un texto informativo; no hay descarga.
4. "Preparar nueva versión" abre un modal con asunto, motivo o evidencia pendiente y confirmación. Hoy valida y muestra "No se guardó nada".
5. Para adjuntar un archivo se validan tipo (PDF, JPEG, PNG) y tamaño (máx. 10 MB). Hoy no se sube, no se escanea y no se lee el contenido.
6. En Firmas, revisa firmantes y orden de un sobre. Hoy no envía nada.
7. En KYC, prepara una solicitud de revisión (identidad, PEP y listas, retención). Hoy no hace consultas externas.

Flujo objetivo: subir a storage privado → escaneo → vincular a negocio, contacto o unidad → nueva versión → sobre de firma → evidencia y sello de tiempo → KYC con responsable y política de retención.

## Datos
Tablas existentes: ninguna de documentos, sobres, firmantes ni KYC en el esquema Drizzle. `ENTITY_TYPES` ya incluye `file`, útil para vincular archivos a entidades.

Entidades propuestas:
- `documento`: id, negocio_id, tipo (contrato, kyc, otro), nombre, estado, responsable_id.
- `documento_version`: documento_id, número, ruta privada en storage, sha256, subido_por, creado_en. Inmutable.
- `sobre_firma`: documento_version_id, estado, orden de firmantes, creado_en.
- `firmante`: sobre_id, nombre, estado de verificación de identidad, firmado_en, sello de tiempo, evidencia.
- `expediente_kyc`: contacto_id, estado, responsable_id, revisado_en, retencion_hasta.

Campos sensibles: número de cédula o pasaporte (solo últimos dígitos en listados), datos bancarios y evidencias. Todos en storage privado y con acceso auditado.

## Estados de UI
- **Cargando**: "Cargando ejemplo…" (vista previa, verificado).
- **Vacío**: "Sin expedientes de ejemplo" y "Sin resultados para este filtro" (verificado).
- **Error**: "No se pudo cargar este ejemplo" (vista previa, verificado).
- **Sin conexión**: "Sin conexión; no hay operaciones pendientes de sincronizar" (vista previa, verificado).
- **Sin permiso**: "Sin permiso sobre este expediente" (vista previa, verificado).
- **Éxito**: no existe. Al preparar una revisión, el mensaje explica que no se guardó, firmó, publicó ni envió nada (verificado).
- **Parcial**: no implementado. Caso previsto: archivo subido con escaneo pendiente.
- El selector "Estados de esta vista previa" es una herramienta de diseño y debe retirarse en producción.

## Estado actual vs PRD
- **Existe y es real**: página protegida por `deals:view`. Validación de revisión (asunto, motivo, confirmación) y de metadatos de archivo (tipo y tamaño), con pruebas en `reglas-expediente.test.ts`. Navegación de tres secciones.
- **Es de ejemplo**: `_ejemplo.ts` contiene dos documentos, un sobre y un expediente KYC ficticios ("Persona ficticia", "Parte A y Parte B de ejemplo").
- **Falta**: almacenamiento privado, versiones, firma con evidencia, KYC con permisos propios, política de retención, permisos por documento.
- **Auditoría 27/10/2026**: "Todo es de ejemplo, aunque Tareas promete un enlace seguro para la Ley 155-17". Prioridad alta. Ocultar KYC y firmas en producción hasta tener storage privado.

## Checklist de aceptación
- [x] Validación de revisión: asunto, motivo y confirmación
- [x] Metadatos de archivo: PDF, JPEG o PNG hasta 10 MB
- [x] Página protegida por permiso
- [x] Avisos de vista previa visibles en cada sección
- [ ] Repositorio privado con URLs firmadas de vida corta
- [ ] Versiones inmutables con hash SHA-256
- [ ] Firma electrónica con evidencia verificable
- [ ] KYC con permiso propio y retención aprobada
- [ ] Permisos por documento y recursos dedicados
- [ ] KYC y firmas ocultos en producción hasta tenerlas

## Dependencias
- Negocios (vínculo principal), Contactos (firmantes y KYC), Unidades (contexto).
- Acceso/RBAC: recursos `documents`, `signatures`, `kyc`.
- Supabase Storage (bucket privado, propuesto).
- Proveedor de firma electrónica y de verificación de identidad: no elegidos.
- Posventa: acta de entrega y garantías firmadas.
- Portal: las vistas de comprador y promotor reutilizan `ExpedientesPrevia`.
- Auditoría (`audit_log`) para cada acceso y descarga.
