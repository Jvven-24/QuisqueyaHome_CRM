---
name: sistema-diseno-uiux
description: Metodología maestra para diseñar, estructurar e implementar sistemas de diseño UI/UX de clase mundial (Private Desk, Fintech, SaaS de Lujo). Integra tokens semánticos, catálogo de componentes (Bento Grids, Split Views, Inspectores 360, Kanban, Anillos SVG), la librería PXIL/Viltrum Design y directrices estrictas de accesibilidad WCAG AA.
---

# Sistema de Diseño UI/UX Maestro (Private Desk & Luxury Systems)

Esta skill proporciona la arquitectura, metodología, reglas estéticas y patrones de código para transformar o crear cualquier aplicación web hacia un estándar de alta gama (**Private Desk**: banca patrimonial, inmobiliaria de lujo, fintech ejecutiva o SaaS B2B de alto valor).

---

## 1. Filosofía de Diseño: "Private Desk"

- **Tono Visual**: Sobrio, prestigioso, de alta confianza. Inspirado en la banca privada suiza, despachos de family office y hospitalidad caribeña de ultra-lujo.
- **Espacio y Composición**: Aprovechamiento inteligente del espacio sin saturación. Jerarquía nítida, contrastes calculados y superficies limpias.
- **Micro-interacciones**: Transiciones sutiles ($\le 180\text{ms}$ a $240\text{ms}$), sombras multicapa sutiles (`shadow-2xs` a `shadow-sm`) y anillos de foco visibles en tono de acento noble (`#C7990E` / `#9B7300`).

---

## 2. Paleta de Tokens Semánticos

Toda aplicación que use esta skill debe definir en sus variables CSS (`:root` o `@theme`) la siguiente escala semántica obligatoria:

```css
:root {
  /* Lienzo y Superficies */
  --canvas: #FAF9F6;           /* Fondo general cálido/marfil */
  --surface: #FFFFFF;          /* Tarjetas y contenedores primarios */
  --surface-raised: #FFFFFF;   /* Modales y drawers emergentes */
  --surface-alt: #F8FAFC;      /* Franjas secundarias y tablas alternadas */

  /* Tipografía y Textos */
  --ink: #0F172A;              /* Texto principal (Navy oscuro profundo) */
  --muted: #64748B;            /* Texto secundario y etiquetas */
  --line: #E2E8F0;             /* Bordes sutiles y divisores */
  --line-strong: #94A3B8;      /* Bordes activos o de foco */

  /* Colores de Marca y Acento Noble */
  --navy-950: #0C1322;         /* Cabeceras de prestigio y tarjetas hero */
  --navy-900: #10172D;
  --gold-600: #C7990E;         /* Oro noble para estados ganados, destacados y acentos */
  --gold-700: #9B7300;         /* Oro de contraste para focos accesibles */
  --gold-soft: #FEF9C3;        /* Fondos de pastillas doradas */

  /* Semáforos Comerciales */
  --success: #10B981;          /* Verde esmeralda */
  --warning: #F59E0B;          /* Ámbar tibio */
  --danger: #EF4444;           /* Rojo caribeño / alerta */
  --info: #0284C7;             /* Azul cielo */
}
```

---

## 3. Catálogo de Componentes de Alto Impacto

### A. Bento Grid Ejecutivo
- Distribución asimétrica pero armónica (ej. grid de 12 columnas con tarjetas de 4, 8, 6 columnas).
- Cabecera en degradado Navy profundo con tipografía en blanco y monograma dorado.
- Barras de absorción comercial en tiempo real con degradado oro-esmeralda.
- Badges destacados de régimen fiscal o certificación (ej. Confotur, ISO, etc.).

### B. Split View & Inspector Lateral 360
- División fluida entre tabla principal y panel de inspección (`LeadInspector`, `DealInspector`, `ContactoInspector`).
- Hero de contacto con avatar de alto contraste, cargo e iniciales.
- Pestañas interactivas: Resumen Financiero, Inventario Asociado, y **Seguimiento con Timeline Cronológico de Auditoría**.
- Acciones de un solo clic con botones táctiles de $48\text{px}$ para WhatsApp, llamadas y correo.

### C. Tablero Kanban Fluido
- Columnas delimitadas por estado comercial (`open`, `won`, `lost`).
- Cabeceras nítidas con total de oportunidades y sumatoria en `tabular-nums font-bold`.
- Tarjetas con chip de proyecto, avatar del asesor, fecha de próxima acción y botón rápido de mensajería.
- **Arrastre interactivo con fallback por teclado**: selector accesible «Mover a…» en menú desplegable para cumplir WCAG AA.
- **Modo Móvil Adaptativo**: acordeón vertical sin scroll horizontal forzado.

### D. Donut Circular SVG (Goal Ring)
- Gráficos circulares SVG vectoriales puros sin dependencias pesadas.
- Relleno de porcentaje en tiempo real con degradado oro/ámbar o verde al superar la meta.
- Sparklines SVG en línea para mostrar la tendencia anual mes a mes.

### E. Modales y Drawers Accesibles (Sin Diálogos Nativos)
- Prohibición estricta de `alert()`, `confirm()` y `prompt()`.
- Utilizar componentes accesibles tipo Radix UI / Shadcn Dialog con foco retenido (`useFocusTrap`), tecla `Escape` y confirmación explícita con motivo para acciones destructivas.

---

## 4. Biblioteca de Componentes PXIL / Viltrum Design

Los proyectos pueden consumir o adaptar componentes ya construidos desde la librería local:
- **Ruta de Recursos**: `E:\VILTRUM\VILTRUM DESING\pxil-ecosystem`
- **Componentes Clave**:
  - `private-library/components/`: Botones, inputs, badges de temperatura, tablas semánticas.
  - `private-library/screen-recipes/`: Recetas de pantallas de catálogo, dashboards analíticos y flujos de reserva.
  - `experience-engine/`: Animaciones de micro-interacción y transiciones suaves.

---

## 5. Reglas Innegociables de Calidad (WCAG AA & Ergonomía)

1. **Tamaño de Fuente**: Todo texto legible para el usuario debe tener $\ge 13\text{px}$ (preferiblemente `text-[13px]` o `text-sm`). Prohibido `text-xs` o `text-[9-11px]` en información crítica o de interacción.
2. **Áreas Táctiles (Touch Targets)**: Todo control interactivo (botones, inputs, toggles, enlaces) debe tener una altura y área de clic $\ge 44-48\text{px}$ (`min-h-12` o `h-11`).
3. **Números Tabulares**: Todas las cantidades monetarias, porcentajes, fechas y contadores deben utilizar `tabular-nums` para evitar saltos visuales al cambiar los datos.
4. **Protección Multimoneda**: En sistemas financieros o comerciales, jamás sumar monedas distintas (ej. USD con DOP/EUR) en un único total sin franja de desglose.
5. **Privacidad Basada en Roles (RBAC)**: Si un usuario tiene rol restringido (broker, agente, asistente), los precios internos reales, márgenes o comisiones ajenas deben ocultarse tanto en el renderizado visual como en la consulta del backend.
6. **Cero Borrado Físico**: Las bajas son lógicas (`deleted_at`), conservando siempre la integridad de la auditoría.
