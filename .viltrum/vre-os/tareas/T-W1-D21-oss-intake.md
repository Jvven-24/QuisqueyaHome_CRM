# T-W1-D21 · Expediente open source (licencia, SHA, puntaje) para VRE-OS

Perfil: **D21 Research**. Modo: analysis (necesita web). Revisor: D03 (otro proveedor).
Mandato padre: `.viltrum/vre-os/M-20261004-VRE.md` §3. Formato del expediente y escala: Blueprint §24–§25
(`C:\Users\wilbe\Downloads\Viltrum_Real_Estate_OS_Master_Blueprint.md`).

## Qué verificar en fuentes oficiales (GitHub/npm/docs), con fecha 2026-10-04
Para cada pieza: repositorio, commit SHA o versión evaluada, licencia detectada (archivo LICENSE real), actividad
reciente, compatibilidad con Next 15 / React 19 / Tailwind v4, riesgos, modo (RUN/APP/PORT/REFERENCE) y puntaje 0–100.

1. shadcn/ui Charts (Recharts): versión de Recharts compatible con React 19.
2. vaul (Drawer) / shadcn Drawer y Sheet.
3. @faker-js/faker (locales en español).
4. Serwist (`@serwist/next`) con Next 15 App Router.
5. MapLibre GL JS + react-map-gl (endpoint `react-map-gl/maplibre`); fuente de teselas gratuita sin clave apta para RD.
6. prolinkinfo/RealEstateCRM: confirmar MIT en el commit, y listar archivos/módulos portables (quotes, invoices,
   property floors/unit types, documents, custom fields).
7. mallyav/CRM (Reality CRM): confirmar si existe licencia. Si no, dejar `code_reuse: BLOCKED`.
8. clawnify/OpenProperty: licencia, módulos de rentas portables.
9. Twenty: alcance de la "Twenty Application Exception" (solo si se usa vía API/apps).
10. Documenso: requisitos de self-hosting (certificado de firma) y API de envelopes.
11. **Huecos**: busca al menos una alternativa MIT/Apache para lo que no cubre la lista: motor de reglas de
    comisiones/planes de pago, timeline de actividades en React, cotización a PDF (p. ej. @react-pdf/renderer).

## Prohibido
Clonar o instalar en el repo del CRM. Modificar archivos fuera del entregable. Inventar SHA o licencias: si no se
pudo verificar, escribe `UNKNOWN` con el motivo.

## Entregable
`.viltrum/vre-os/D21-oss-intake.md`: tabla resumen (pieza · modo · licencia · SHA/versión · puntaje · veredicto) y
un bloque YAML por pieza con el formato del Blueprint §24. Sección `## Fuentes` con URL por afirmación.
