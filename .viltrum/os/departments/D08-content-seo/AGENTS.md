# D08 — Método operativo

## Contrato de entrada

De D04 recibo: sitemap, inventario de pantallas públicas, recorridos críticos de
conversión.

De D05 recibo: composición visual donde vive el contenido y los CTA.

De D02 recibo: objetivo de negocio, prioridad de cada página pública, métrica de éxito.

**Si no tengo la métrica de éxito de D02, no defino el evento de conversión — lo pido antes
de escribir un solo CTA.** Un botón bien escrito que nadie mide es indistinguible de uno
mal escrito.

---

## Procedimiento

### 1 — SEO técnico, antes que el contenido

Por cada página pública del sitemap:

| Elemento | Regla |
|---|---|
| Título (`<title>`) | Único por página, describe el contenido real, dentro de ~50-60 caracteres visibles en resultados |
| H1 | Uno solo por página, coincide con el tema real, no duplica el título literal |
| Jerarquía de encabezados | H2/H3 en orden, sin saltos que rompan la estructura |
| Meta descripción | Única por página, resume el contenido, invita a la acción, no es relleno de palabras clave |
| Canonical | Presente en toda página, apunta a la URL preferida cuando hay variantes (parámetros, filtros, `www` vs. sin `www`) |
| Sitemap XML | Incluye toda página indexable, se actualiza cuando el sitemap de D04 cambia |
| `robots.txt` | Controla rastreo, no autorización ni desindexación garantizada. Privadas requieren control de acceso; `noindex` debe poder leerse por el crawler cuando se use |
| Hreflang | Presente si el sitio tiene más de un idioma o región, apuntando a la versión correcta de cada página |
| URL | Legible, estable, en minúsculas, sin parámetros innecesarios para contenido indexable |
| Structured data (schema.org) | Tipo correcto según el contenido (Organization, Product, Article, FAQPage, BreadcrumbList, LocalBusiness) — sin declarar datos que la página no muestra |
| Open Graph / Twitter Cards | Título, descripción e imagen propios para compartir en redes, no genéricos del sitio completo |
| Contenido duplicado | Ninguna página compite consigo misma por la misma intención de búsqueda sin canonical o consolidación |

**Prueba:** ¿puede un motor de búsqueda rastrear, indexar y entender de qué trata esta
página sin ambigüedad? Si no, el contenido que se escriba encima no sirve.

### 2 — Rendimiento como factor (no como propietario)

- [ ] Se registran las métricas de Core Web Vitals de la página (LCP, INP, CLS) como
  insumo, coordinando con D15 la corrección técnica
- [ ] Umbrales de referencia: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, medidos en percentil 75
- [ ] Se documenta el impacto esperado en posicionamiento y conversión si la página no
  cumple, sin ejecutar la optimización técnica (eso es D15/D09)

### 3 — Contenido y microcopy

- [ ] Cada página responde la pregunta que trajo al usuario en los primeros dos párrafos o
  en el primer scroll — sin relleno antes del contenido útil
- [ ] Encabezados describen el contenido real de su sección, no frases genéricas
- [ ] Botones dicen qué hacen ("Solicitar cotización", "Crear cuenta gratis"), nunca solo
  "Aceptar" o "Enviar" sin contexto
- [ ] Mensajes de error y confirmación coordinados con D06: mismo tono, mismo idioma, sin
  contradicción entre lo que dice el sistema y lo que dice el contenido de marketing
- [ ] Números, fechas y moneda con formato local correcto (coordinado con D05/D11)
- [ ] Texto alternativo de imágenes redactado con función real, no "imagen1.jpg" (coordinado con D07)
- [ ] Sin texto de relleno ("Lorem ipsum", placeholders) en la entrega final

### 4 — CTA y jerarquía de acción

- [ ] Una acción primaria por pantalla o sección, visualmente inequívoca (coordinado con D05)
- [ ] El texto del CTA describe el resultado de la acción, no el mecanismo ("Ver planes y precios", no "Clic aquí")
- [ ] CTA secundarios no compiten visualmente con el primario
- [ ] Todo CTA relevante para el negocio tiene un evento de conversión asociado — ver paso 5

### 5 — Embudo y eventos de conversión

Para cada recorrido crítico marcado por D04 como relevante al negocio:

```
EVENTO: <nombre estable, ej. "lead_formulario_contacto_enviado">
DISPARADOR: <acción exacta del usuario>
PASO DEL EMBUDO: <en qué etapa ocurre — descubrimiento, consideración, decisión>
DATO QUE CAPTURA: <mínimo necesario, nunca más>
DEPENDE DE CONSENTIMIENTO: sí/no
```

- [ ] Cada paso del embudo tiene su evento — no solo el evento final de conversión
- [ ] Los nombres de evento son estables y documentados en un solo catálogo, no inventados por página
- [ ] Ningún evento captura dato personal más allá de lo necesario para medir

### 6 — Analítica con consentimiento

- [ ] Existe banner o mecanismo de consentimiento **antes** de cargar cualquier script de
  analítica o marketing que use cookies o almacenamiento no esencial
- [ ] El consentimiento distingue categorías (esencial, analítica, marketing) — no es
  aceptar-todo-o-nada cuando la ley exige granularidad
- [ ] Rechazar es tan fácil como aceptar — mismo número de pasos, sin patrón oscuro
- [ ] Ningún evento de analítica o marketing se dispara antes de que el usuario decida
- [ ] La decisión del usuario se recuerda y se puede cambiar después (panel de preferencias accesible)

### 7 — Cumplimiento legal de privacidad y cookies

**República Dominicana — Ley No. 172-13** (protección integral de datos personales,
promulgada el 13 de diciembre de 2013):

- [ ] Todo formulario que capture datos personales indica para qué se usan y por cuánto tiempo (coordinado con la política de retención de D11)
- [ ] Datos sensibles (salud, origen racial, afiliación sindical, creencias religiosas u orientación sexual, según la ley) solo se recolectan con consentimiento expreso y por escrito, y nunca sin necesidad real del negocio
- [ ] Si el proyecto transfiere datos personales fuera del país (hosting extranjero, proveedor de analítica), existe base legal para la transferencia (consentimiento, contrato o tratado aplicable) y está documentado
- [ ] Existe canal para que el titular del dato ejerça sus derechos de acceso y corrección sobre su información (habeas data)
- [ ] Si el sector es financiero o de datos crediticios, se contempla la supervisión de la Superintendencia de Bancos como ente de control

**General (más allá de RD, cuando el proyecto tiene alcance internacional):**

- [ ] Política de privacidad describe qué se recolecta, para qué, cuánto se conserva y con quién se comparte — alineada con lo que D11 documentó como retención real, no una plantilla genérica
- [ ] Si hay usuarios en la Unión Europea o California, se señala como riesgo legal a evaluar con asesoría externa (GDPR, CCPA) — D08 no declara conformidad con esos marcos por sí solo

### 8 — Verificación propia

- [ ] SEO técnico verificado página por página, no solo en la plantilla
- [ ] Cada CTA relevante tiene evento de conversión documentado
- [ ] Consentimiento verificado como bloqueante antes de cualquier script de terceros
- [ ] Política de privacidad revisada contra la recolección real, no contra una plantilla

### 9 — Handoff

Entrego a D09 (implementación de metadatos, schema.org y scripts de analítica con
consentimiento) y a D02 (revisor, valida que el contenido y los embudos respondan a la
estrategia real).

---

## Herramientas y skills

| Situación | Skill |
|---|---|
| Verificar metadatos y SEO técnico en el sitio real | `browser-automation`, `playwright-cli` |
| Explorar direcciones de copy y estructura de página | `ui-design` |
| Auditar contenido y CTA ya implementados | `21st-ui-review`, `code-review` |

**No hay skill instalada dedicada a auditoría SEO automatizada (tipo Lighthouse SEO,
Screaming Frog) ni a gestión de consentimiento (CMP).** Se registra como límite conocido.

---

## Contrato de salida

- [ ] SEO técnico completo por página: título, H1, canonical, sitemap, robots, hreflang si aplica, structured data, Open Graph
- [ ] Core Web Vitals registrados y comunicados a D15/D09 si no cumplen umbral
- [ ] Contenido y microcopy sin relleno, con función clara en cada texto
- [ ] Un CTA primario por pantalla, con texto orientado a resultado
- [ ] Catálogo de eventos de conversión por paso del embudo, con nombres estables
- [ ] Consentimiento de cookies verificado como bloqueante antes de analítica o marketing
- [ ] Evidencia técnica de recolección, retención y política de privacidad revisada con D11/D12; dictamen legal asignado cuando aplique
- [ ] Política de privacidad alineada con la recolección real documentada por D11
- [ ] Handoff a D09 con especificación implementable
- [ ] Revisión de D02 firmada

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Escribir contenido antes de verificar que la página es indexable | SEO técnico primero — paso 1 |
| CTA genérico ("Clic aquí", "Enviar") | Texto orientado al resultado de la acción |
| Evento de conversión inventado sin catálogo | Un solo catálogo de eventos, nombres estables |
| Analítica activa antes del consentimiento | Consentimiento bloqueante, verificado en el paso 6 |
| Aceptar-todo-o-nada en el banner de cookies | Categorías granulares, rechazar igual de fácil que aceptar |
| Política de privacidad genérica copiada de otro sitio | Contrastada con recolección real de D11 y obligaciones confirmadas por D12/asesoría |
| Formulario que pide datos sensibles sin consentimiento expreso | Verificación explícita contra Ley 172-13 antes de publicar |
| Meta descripción y título duplicados entre páginas | Únicos por página, verificados en el sitemap completo |
| Structured data que declara contenido que la página no muestra | Solo se declara lo que existe visible y verificable |
| Medir rendimiento pero no reportarlo a quien puede corregirlo | Handoff explícito a D15/D09 con los números medidos |


## Integración PXIL (2026-09-30)

Antes de diseño o revisión de experiencia, cargar `skills/viltrum-pxil-design/SKILL.md`.
Las skills complementarias del contrato son: pxil-experience-contract.
Consultar `registry/design-resources.json` y la plantilla de contrato de experiencia.
PXIL aporta trazabilidad y estados; conserva los gates, C1 y revisor de Viltrum.
