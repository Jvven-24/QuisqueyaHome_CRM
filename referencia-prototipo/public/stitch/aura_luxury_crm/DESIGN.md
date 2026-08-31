---
name: Aura Luxury CRM
colors:
  surface: '#121416'
  surface-dim: '#121416'
  surface-bright: '#37393c'
  surface-container-lowest: '#0c0e11'
  surface-container-low: '#1a1c1e'
  surface-container: '#1e2022'
  surface-container-high: '#282a2c'
  surface-container-highest: '#333537'
  on-surface: '#e2e2e5'
  on-surface-variant: '#d1c5b2'
  inverse-surface: '#e2e2e5'
  inverse-on-surface: '#2f3033'
  outline: '#9a8f7e'
  outline-variant: '#4e4637'
  surface-tint: '#ebc166'
  primary: '#ebc166'
  on-primary: '#402d00'
  primary-container: '#c9a24b'
  on-primary-container: '#4f3900'
  inverse-primary: '#795902'
  secondary: '#c8c6c8'
  on-secondary: '#303032'
  secondary-container: '#474649'
  on-secondary-container: '#b7b4b7'
  tertiary: '#c8c6c7'
  on-tertiary: '#313031'
  tertiary-container: '#a9a7a8'
  on-tertiary-container: '#3d3c3e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdf9e'
  primary-fixed-dim: '#ebc166'
  on-primary-fixed: '#261a00'
  on-primary-fixed-variant: '#5b4300'
  secondary-fixed: '#e5e1e4'
  secondary-fixed-dim: '#c8c6c8'
  on-secondary-fixed: '#1b1b1d'
  on-secondary-fixed-variant: '#474649'
  tertiary-fixed: '#e5e2e3'
  tertiary-fixed-dim: '#c8c6c7'
  on-tertiary-fixed: '#1c1b1c'
  on-tertiary-fixed-variant: '#474647'
  background: '#121416'
  on-background: '#e2e2e5'
  surface-variant: '#333537'
  surface-elevated: '#141416'
  background-base: '#0A0A0B'
  gold-light: '#E5C17D'
  gold-dark: '#9E7B31'
  status-success: '#22C55E'
  status-warning: '#F59E0B'
  status-danger: '#EF4444'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  container-max-width: 1440px
---

## Brand & Style

The design system is engineered for the elite real estate sector, specifically catering to users in the 45-64 age demographic. The brand personality is **Exclusively Premium & Elite**, evoking the feeling of a private wealth management tool rather than a utility-grade CRM. 

The aesthetic follows a **Modern Corporate** approach with **Glassmorphic** influences. It prioritizes "Information Parsimony"—a philosophy of low data density that prevents cognitive overload. By utilizing generous whitespace (even within a dark UI) and high-contrast gold accents, the system creates a focused, high-end environment that feels both technologically advanced and comfortably legible.

Visual hierarchy is established through tonal layering and light-refractive gradients, ensuring that the most critical financial data points are immediately accessible to mature users.

## Colors

The palette is anchored by a high-contrast dark theme to minimize eye strain while maintaining a sophisticated atmosphere. 

- **Primary Gold (`#C9A24B`):** Reserved for high-value interactive elements, active states, and success indicators. For primary buttons, a linear gradient from `gold-light` to `gold-dark` (180 degrees) is used to simulate a metallic, tactile finish.
- **Surface Strategy:** The system uses `background-base` (`#0A0A0B`) for the application canvas. `surface-elevated` (`#141416`) is used for cards, tables, and sidebars to create structural depth.
- **Typography Colors:** Primary text uses `neutral-color` at 90% opacity for maximum legibility without harsh glare. Secondary text and labels use 60% opacity.
- **States:** Active navigation elements and "Unassigned Leads" utilize the gold pulse effect to signify urgency without using traditional "tech blue."

## Typography

Typography is the cornerstone of accessibility for this design system. We utilize **Hanken Grotesk** for headings to provide a sharp, contemporary precision, while **Inter** is used for body text due to its exceptional legibility at larger scales.

To accommodate the 45-64 age demographic, the base body size is set to **18px** (`body-lg`) for lead details and notes. We avoid thin font weights; the minimum weight for any critical data point is 400. 

For financial figures (KPIs), `display-lg` is used with a tighter letter spacing to emphasize the "Luxury Real Estate" branding. All labels use an uppercase treatment with slight tracking to ensure they are distinguishable from body content.

## Layout & Spacing

The layout utilizes a **Fixed Grid** model on desktop to maintain a premium, composed look that doesn't feel stretched on ultra-wide monitors.

- **Desktop (1440px+):** A 12-column grid with a 65/35 split for the main dashboard. The sidebar is fixed at 280px.
- **Rhythm:** We follow an 8px spacing scale. However, to maintain "low density," vertical padding in table rows and cards should default to 24px or 32px.
- **Safe Areas:** Generous margins (40px) are required around the primary container to prevent the interface from feeling "crowded."
- **Reflow:** On tablet and mobile, the 35% widget column stacks below the main funnel/charts. The right-side "Lead Detail" drawer transitions to a full-screen modal on mobile devices.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** supplemented by **Ambient Shadows**.

1.  **Level 0 (Base):** `#0A0A0B`.
2.  **Level 1 (Cards/Sidebar):** `#141416` with a subtle 1px border of `#C9A24B` at 10% opacity.
3.  **Level 2 (Modals/Drawers):** `#1C1C1E` with an extra-diffused gold-tinted shadow (`rgba(201, 162, 75, 0.08)`) with a 30px blur.

We use "Ghost Borders"—low-opacity outlines—instead of heavy shadows to define secondary elements. This maintains a clean, modern aesthetic without the "muddiness" often found in dark mode designs. Backdrop blurs (20px) are applied to navigation headers to provide a sense of transparency and height.

## Shapes

The system uses a **Rounded** (`0.5rem`) shape language. This provides a professional yet approachable feel, softer than sharp corporate edges but more disciplined than "bubbly" consumer apps.

- **Cards & Inputs:** 8px (`0.5rem`) corner radius.
- **Primary Buttons:** 12px (`0.75rem`) to make them feel more tactile and distinctive.
- **Status Badges/Chips:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.
- **Avatars:** Circular (100% radius) to contrast against the geometric grid.

## Components

- **Buttons:** Primary buttons feature the Gold Gradient with white or near-black text. Secondary buttons are "Ghost" style with a gold outline. On mobile, buttons use a minimum height of 56px to ensure ease of use for "on-the-go" brokers.
- **Tables:** Dark tables with high contrast. Row hover states should use a subtle highlight of `#1C1C1E`. Zebra striping is avoided in favor of thin, 1px dividers (`#27272A`).
- **Input Fields:** Large tap targets. Background is `#0A0A0B` (to contrast against the `#141416` card) with a 1px border. Focus state triggers a solid gold border and a subtle gold outer glow.
- **Cards:** Used for lead summaries and property listings. They must include generous internal padding (min 24px).
- **Iconography:** Linear, 2px stroke weight. Active navigation icons should be filled or outlined in gold.
- **Pipeline Funnel:** Uses a "Gold Pulse" on the active stage. Inactive stages are rendered in a desaturated gray to keep the focus on the current progress.
- **Status Badges:** Use localized flags for lead origin and high-contrast text for status (e.g., "Reservado" in Gold text over a dark gold background).