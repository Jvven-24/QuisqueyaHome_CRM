---
id: G22
sistema: Etapa 2 UI · controles compartidos, expansivos, toasts, KPI compactos, RBAC sin scroll, Metas (Bento 5/Awards/StatsBento) y arreglos INV-04..08
estado: READY
riesgo: R1
owner: Wilber (aprobado por voz el 2026-10-27 a las 11:19 AM RD, a través de Grok Bot)
actualizado: 2026-10-27
---
# G22 · Etapa 2 UI (iteraciones Luna 6 + Metas)
Alcance permitido: src/components/ui/** (checkbox, radio-group, switch, accordion/collapsible, sonner/toasts, kpi/resumen compacto, stats-bento, bento, award), src/components/modulo/**, src/app/globals.css y tokens de Viltrum Design, src/app/(crm)/** EXCEPTO tareas/** y archivos de auth/login/correo.
Ítems:
1. Controles compartidos: checkbox, radio y switch con control visible de 16-18 px, área táctil ≥44x44 px, foco visible, AA, disabled/indeterminate; reemplazar inputs ad-hoc.
2. Componentes expansivos (Accordion/Collapsible Radix), aria-expanded, teclado, motion ≤220ms.
3. Sistema único de toasts (sonner/shadcn), aria-live, sin duplicados.
4. KPI / resúmenes compactos que no empujen el contenido a 390 px.
5. Matriz RBAC sin scroll lateral a 1280 y 390 px (solo UI; sin cambiar reglas de permisos).
6. Metas: Bento 5, Awards y StatsBento de 21st.dev adaptados con datos reales, español, tokens Viltrum, AA (deps permitidas: recharts, @tabler/icons-react).
7. Contraste INV-04..INV-07 y área táctil INV-08 (ver /workspace/crm-plan/qa-antigravity/INVENTARIO-SIN-PROPIEDAD-2026-10-27.md).
Sin cambios de rutas, datos, permisos ni migraciones. Sin deploy. Revisión cruzada por otro modelo antes de merge. Pruebas: node22 --test, tsc.
Referencia de diseño: /workspace/crm-plan/diseno/GUIA-UI-REFERENCIA.md.
## Enmienda 1 · 2026-10-27 (misma aprobación de Wilber, voz 11:19 AM RD vía Grok Bot)
8. OpenSlotBooking (open-slot-booking.tsx, 21st.dev) en Agenda (visitas y citas con brokers) y en una página pública de cita para leads, conectado a la integración multi-cuenta de Google Calendar: free/busy alimenta loadHostBusy y onBook crea el evento. Alcance extra: src/app/(crm)/agenda/**, la ruta pública de cita y el adaptador de Google Calendar existente (sin migraciones; si hace falta una, ficha aparte).
9. Patrones de tallyho.app: barra de presupuesto que se consume en Metas y en Avances de obra; archivar en lugar de borrar; Quick Add que se rellena con lo último registrado; jerarquía cliente > proyecto > fase (solo UI/navegación sobre datos existentes).
