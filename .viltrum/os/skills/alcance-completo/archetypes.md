# Arquetipos de funcionalidad — lo que cada uno conlleva

Punto de partida, no techo: la investigación (paso 3) añade lo que falte. Cada viñeta es un requisito a
confirmar como "entra", "después" o "decisión humana".

## 1. Identidad y cuentas de usuario
- Registro con correo y contraseña (política de contraseña, comprobación de filtradas), con proveedor social
  (Google; Apple si hay app iOS), aceptación de términos y consentimiento separado de marketing.
- Verificación de correo (enlace con caducidad, reenvío con límite), bienvenida.
- Inicio de sesión, "recordarme", cierre de sesión en este y en todos los dispositivos, lista de sesiones.
- Recuperar contraseña (token de un solo uso, caducidad, sin revelar si el correo existe), cambiar contraseña,
  cambiar correo con reverificación, vincular/desvincular Google, MFA (obligatorio para staff, opcional usuario).
- Perfil: nombre, teléfono con máscara y país, idioma preferido, preferencias de contacto, avatar.
- Privacidad: exportar mis datos, borrar mi cuenta (lógico + purga programada), historial de consentimientos.
- Seguridad: rate limiting y bloqueo progresivo, CSRF, cookies seguras, rotación de sesión, auditoría de accesos,
  alerta de inicio nuevo, protección contra enumeración y relleno de credenciales.
- Administración: listado y búsqueda de usuarios, estado (activo, pendiente, bloqueado), ver actividad y
  favoritos, forzar restablecimiento, revocar sesiones, cambiar rol, exportar, auditoría de acciones de staff.
- Invitación a registrarse en el momento de valor (guardar favorito, pedir cita), sin muro previo.
- Pantallas: registro, inicio, verificación pendiente/ok/caducada, recuperar, nueva contraseña, perfil,
  seguridad, sesiones, privacidad, panel; cada una con los seis estados.

## 2. Módulo CRUD con asignación (p. ej. asesores con proyectos a cargo)
- Entidad con identificador público separado del interno, slug, estado (borrador, activo, inactivo), borrado lógico.
- Ficha pública y listado público con filtros; placeholder neutro cuando falta foto; SEO (schema.org Person/RealEstateAgent).
- CMS: crear, editar, ordenar, activar/desactivar, foto con recorte, idiomas, validación en tres capas.
- Asignación N:M o 1:N con reglas (principal/suplente, vigencia desde/hasta, historial de reasignaciones).
- Uso en el resto del producto: la ficha de proyecto muestra su asesor; el contacto/cita llega al asesor correcto;
  valor por defecto cuando no hay asignación.
- Integración futura (CRM) mediante identificador externo y puerto de sincronización, sin acoplar ahora.
- Permisos: quién crea, quién asigna, quién ve datos de contacto; auditoría de cambios.

## 3. Roles y permisos configurables
- Catálogo de permisos (recurso × acción) en BD, roles como conjuntos editables, rol por defecto, roles de sistema
  no borrables, asignación a usuarios, alcance opcional (por proyecto/zona).
- Verificación en servidor en cada endpoint y en BD (RLS/grants), nunca solo en la UI; cache con invalidación.
- UI de administración: matriz rol × permiso, previsualizar "ver como", auditoría, protección contra quitarse a sí mismo el último admin.
- Pruebas: matriz completa de rol × endpoint (permitido/denegado), incluida escalada horizontal.

## 4. Habilitar un idioma
- Catálogo de interfaz con paridad de claves y placeholders; plurales; formatos de fecha/número/moneda por locale.
- Contenido de BD traducido (proyectos, zonas, páginas, taxonomías) con estado por campo (máquina/revisado).
- Rutas y SEO: prefijo de idioma, hreflang, sitemap por idioma, `lang` y `dir` en el documento.
- Selector de idioma accesible; preferencia persistida; idioma del correo transaccional.
- Revisión humana o de otro modelo por idioma; desbloqueo solo tras revisión; prueba de paridad en CI.

## 5. Componente móvil nativo (hoja inferior, carrusel, gestos)
- Gestos con puntos de anclaje, velocidad y umbral; arrastre solo desde la zona prevista; no interfiere con el scroll interno.
- Alternativa accesible a todo gesto (botones, teclado), `prefers-reduced-motion`, foco atrapado y devuelto, Escape.
- Safe areas, teclado virtual abierto, orientación, 60 fps (transform/opacity), sin saltos de layout.
- Reutilizar el hook existente antes de añadir librería; pruebas de interacción (Playwright touch) y visuales.

## 6. Taxonomía / categoría administrable en el CMS
- Tabla de catálogo con slug estable, nombre por idioma, orden, icono, activo, uso contado; nunca enum en código.
- CRUD en CMS con validación de duplicados, fusión de categorías, protección de borrado si está en uso.
- El portal lee la taxonomía en tiempo de ejecución; filtros y SEO se generan desde ella.

## 7. Asistente IA sobre el conocimiento propio (RAG)
- Ingesta de todas las fuentes publicadas (fichas, vídeos, guías, documentos aprobados) con versión y fecha.
- Índice vectorial + búsqueda léxica (híbrida), filtro por publicación e idioma, citas a la fuente en cada respuesta.
- Herramientas para datos estructurados (precio, disponibilidad, comparación) en vez de texto libre.
- Guardas: nada no aprobado, nada inventado, "no lo sé" con derivación a un asesor humano; límites de consumo.
- Evaluación: conjunto de preguntas reales con respuesta esperada, medición de exactitud y de alucinación.
- Proveedor de modelo detrás de un puerto (P1); coste y latencia observados.

## 8. Medios y vídeos
- Subida con validación de tipo/tamaño real, variantes y formatos modernos, recorte, texto alternativo por idioma.
- Derechos de uso y fuente; relación con proyectos; orden; portada; vídeos por proveedor (YouTube, Drive) con miniatura correcta.
- Biblioteca en el CMS con búsqueda, filtros, uso por proyecto y protección de borrado.

## 9. Pagos y cobros
- Proveedor detrás de un puerto (P1); tokenización, nunca datos de tarjeta propios (alcance PCI mínimo); 3DS cuando aplique.
- Idempotencia, estados del pago (pendiente, autorizado, capturado, fallido, reembolsado, contracargo), webhooks con firma, conciliación contable.
- Legal y fiscal: impuestos y comprobante/facturación, términos de cancelación y reembolso, Ley 172-13 (datos personales), contracargos.
- Costo/comisión del proveedor y moneda; la cuenta de comerciante, claves y paso a producción son acción humana (secretos fuera del repo, sandbox vs producción).
- Dispara en `module-impact-matrix.md` las filas "Legal, fiscal, financiero y cumplimiento" y "Secretos, entornos y cuentas externas"; riesgo R2+.
