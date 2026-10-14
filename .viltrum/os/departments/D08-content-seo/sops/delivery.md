# D08 · Entrega de contenido, SEO y conversión

Versión 1 · 2026-09-29 · F3, validación del sitio en F5/F6 · revisor D02. Leer `../AGENTS.md`, `../SOUL.md`, sitemap D04, contenido/voz aprobado y políticas de datos D11/D12. Este protocolo convierte obligaciones en evidencia técnica; no emite dictamen legal ni garantiza posicionamiento o conversión.

## Entradas y aplicabilidad

D02: audiencia, propuesta de valor, afirmaciones verificables, objetivo, métrica y restricciones. D04/D05: rutas, estructura, idiomas, acciones y composición. D11/D12: recolección, retención, política de consentimiento y terceros autorizados. Registrar URL/versión si existe implementación. Apps privadas pueden necesitar microcopy sin SEO público; declarar no aplicable SEO, no inventar páginas indexables.

## Procedimiento

1. **Mapa de contenido.** Por ruta/REQ definir intención, audiencia, tarea, pregunta que responde, responsable, acción, fuente de afirmaciones y fecha de revisión. No inventar testimonios, certificaciones, cifras, precios ni garantías. Reconciliar copy con reglas y alcance D02. Cada idioma necesita responsable y contenido equivalente, sin traducir identidades/catálogos arbitrariamente.
2. **Redacción y microcopy.** Entregar títulos, estructura semántica, ayuda, etiquetas, validaciones, errores/confirmaciones y CTA con resultado claro. Coordinar D06 para que un éxito de interfaz no afirme operación que aún está pendiente. Mantener catálogos/localización compartidos y longitud representativa para D05/D09. Política de privacidad describe tratamiento confirmado; partes legales van a responsable D12/asesoría.
3. **Indexación y rastreo.** Por URL especificar pública/privada, status esperado, canonical, título/descripción, encabezados, enlaces internos, sitemap, robots/noindex y redirecciones. `robots.txt` controla rastreo y no protege datos ni garantiza desindexación. Las rutas privadas requieren autenticación/autorización; la directiva noindex debe poder ser leída por el crawler donde se use. Resolver filtros, paginación, parámetros, idiomas/hreflang, 404 reales y migraciones de URL con D09/D03.
4. **Metadatos y datos estructurados.** Redactar títulos únicos y fieles al contenido sin tratar un conteo de caracteres como obligación de Google. Canonical refleja URL preferida y no una regla de autorización. Datos schema.org representan contenido visible/verificable; elegibilidad de resultados enriquecidos depende de reglas actuales de Google y no está garantizada. Entregar JSON-LD propuesto y validación pendiente si no existe sitio.
5. **Medición y privacidad.** Catálogo por evento: nombre, disparador, fuente confiable, paso/objetivo, propiedades permitidas, consentimiento necesario, deduplicación y dueño. No enviar campos libres, correo, teléfono ni secretos a analítica. Diferenciar clic, solicitud recibida y conversión completada del servidor. D12 confirma tratamiento por jurisdicción y necesidad; las categorías no esenciales se mantienen bloqueadas hasta autorización/consentimiento según la política del proyecto.
6. **Verificación del sitio.** En entorno disponible revisar DOM renderizado/HTML inicial, headers, canonical, status, enlaces, sitemap y rutas por rol. Probar antes de decidir, aceptar, rechazar, revocar y cambiar preferencias: tráfico/storage debe corresponder a política. Registrar herramienta/versión, URL y evidencia. Lighthouse/laboratorio sirve de diagnóstico; Core Web Vitals de campo al percentil 75 requiere datos de campo y D15. No afirmar una medición INP de campo a partir de una sola navegación.
7. **Aprendizaje.** Definir baseline y observación con D02/D17, controlando duplicados y límites de muestra. Un aumento sin control de causas es correlación. Antes de experimentar completar la ficha siguiente; sin tráfico suficiente priorizar prueba de comprensión o usabilidad. Para landing aplicar `core/design-experience-os.md` (§5 y flujo DG) y la sección H de `checklists/content-conversion.md`: narrativa, prueba social trazable, variante móvil y localización con evidencia de comprensión. Cambios de propuesta vuelven a D02.

## Ficha de experimento

Se registra antes de iniciar en `conversion-events.md` y se enlazan resultados/decisión desde `content-verification.md`. D02 revisa objetivo y decisión; D12 revisa tratamiento y D17 recibe la medición. La ficha no autoriza instalar herramientas ni publicar variantes.

| Campo | Evidencia requerida |
|---|---|
| Identidad y baseline | ID, ruta/REQ, versión de control y variante, dueño, objetivo D02, periodo, denominador y muestra del baseline |
| Hipótesis | Cambio propuesto, audiencia y efecto esperado; distinguir hipótesis de hecho comprobado |
| Métrica primaria | Una métrica ligada al objetivo, evento/fuente, denominador y criterio de decisión fijado antes de observar resultados |
| Guardrails | Métricas que no deben degradarse, sus límites y respuesta ante incumplimiento; acordar con D02/D12/D15 según el impacto |
| Asignación | Unidad (usuario/sesión u otra justificada), población elegible, método y proporción por variante; comprobar asignación estable, contaminación y exclusiones |
| Instrumentación y consentimiento | Eventos deduplicados, propiedades mínimas, validación de fuente y política D12; ningún dato personal por campos libres |
| Muestra, duración y parada | Tamaño/criterio suficiente, duración mínima/máxima, regla de parada y condiciones de aborto fijados antes del inicio; asesoría estadística cuando haga falta |
| Resultado y decisión | Periodo/muestra reales, métrica primaria y guardrails por variante, incertidumbre, incidencias y decisión razonada (adoptar, descartar o inconcluso), con revisión D02 |

No parar al aparecer una mejora favorable fuera de la regla acordada. Si la muestra es insuficiente, la asignación falla o falta evidencia de instrumentación, registrar **inconcluso/no verificado** y la próxima acción con dueño; no declarar una variante ganadora ni impacto causal. Las pruebas de comprensión/usabilidad se registran como tales y no sustituyen un experimento de conversión.

## Salidas y handoff

`.viltrum/design/content-map.md`, `content-copy.md`, `seo-spec.md`, `conversion-events.md` y `content-verification.md`. `.viltrum/departments/D08-content-seo.md` indexa fuentes, versiones, evidencia, campos sensibles excluidos, pendientes y resultados reales frente a propuestas.

**D02** revisa adecuación y objetivos; **D09** implementa metadatos, texto y eventos; **D12/D11** revisan tratamiento/datos; **D07** revisa etiquetas y estructura; **D15** recibe hallazgos de rendimiento; **D17** recibe medición. No escribir ni publicar en herramientas externas por efecto del SOP.

## Checklist de aceptación

- [ ] Copy y afirmaciones tienen fuente, propietario, requisito y aprobación D02.
- [ ] Todas las rutas públicas del alcance tienen intención, metadatos y política de indexación; privadas conservan control de acceso real.
- [ ] Canonical, robots/noindex, sitemap y hreflang son coherentes y tienen evidencia o pendiente de implementación.
- [ ] Schema representa contenido existente y sus límites de elegibilidad están declarados.
- [ ] Eventos tienen disparador confiable, deduplicación, propiedades mínimas y política D12; no filtran datos personales por campos libres.
- [ ] Consentimiento/preferencias se comprueban con tráfico real si hay sitio; sin sitio constan como plan pendiente.
- [ ] Métricas distinguen laboratorio/campo, periodo/muestra y observación/causalidad.
- [ ] Landing cumple la sección H de la checklist, con fuentes de prueba social y evidencia de narrativa móvil/localización y comprensión.
- [ ] Cada experimento tiene ficha previa, resultados contrastados con métrica primaria/guardrails y decisión revisada; datos insuficientes constan como inconclusos.
- [ ] D02 revisa paquete; privacidad formal pendiente va a responsable legal y no se declara resuelta por el agente.

## Herramientas, límites y delegación

Repositorio/navegador permiten especificación e inspección. Search Console requiere propiedad autorizada, cuenta y datos; su existencia no se presume. Lighthouse requiere runtime/CLI o herramienta ya disponible y navegador. Playwright requiere paquetes/binarios. No se instala una CMP ni se activa analítica al leer este perfil; la adopción pasa por D21/D12/D19 y autorización de la tarea.

GrowthBook es un candidato opcional **PILOT**, conforme a `core/design-experience-os.md`; su licencia es mixta (MIT para la mayoría y licencia comercial en directorios enterprise, según la auditoría D08 en `.viltrum/evolucion/diseno.json`). La adopción requiere decisión humana sobre edición/licencia, costo operativo y eventos autorizados, con revisión D21/D12/D19. Instalación, acceso e integración en el host **no verificados**: comprobarlos antes del piloto; la herramienta no reemplaza la ficha ni acredita validez estadística.

Delegar `seo-route-review` en sitios grandes para grupos de URLs con política y versión; recibir metadatos/status/evidencia y problemas, conservando duplicados por URL. Delegar `copy-consistency-review` por idioma o catálogo. Buscar especialista SEO para migraciones grandes/internacionalización, estadístico para experimentos inferenciales y asesoría legal para dictamen de tratamiento. D08 consolida; D02 conserva revisión.

## Fuentes oficiales consultadas el 2026-09-29

- [Google Search Central · SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
- [schema.org · Getting Started](https://schema.org/docs/gs.html).
- [web.dev · Web Vitals](https://web.dev/articles/vitals).
