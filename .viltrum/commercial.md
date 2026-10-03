---
id: "commercial-quisqueyahome-crm"
programa: "M-20261003"
aprobador: "Wilber De La Rosa"
condicion: C1
estado: "activo"
actualizado: 2026-10-03
---

# Mandato Comercial y Alcance C1 · QuisqueyaHome CRM

## 1. Alcance Aceptado
- **Producto:** QuisqueyaHome CRM Inmobiliario.
- **Entorno:** Local-First estricto. Prohibido ejecutar `git push` a repositorios remotos sin autorización explícita previa de Wilber De La Rosa.
- **Estándar:** Viltrum Agentic OS nivel Enterprise (Clean Architecture, Clean UI sin emojis, 6 estados UX por vista, auditoría cruzada P4).
- **Módulos bajo contrato (M01 - M15):**
  - M01: Leads Inmobiliarios & Scoring de Inversión
  - M02: Extracción y Triaje HITL de Notas de Voz WhatsApp/Telegram
  - M03: Embudo de Ventas Kanban con 6 Etapas Dominicanas Validadas
  - M04: Motor Fiscal Confotur (Ley 158-01: Exención 3% Transferencia y 1% IPI a 15 años)
  - M05: Gestión de Propiedades y Unidades Asociadas
  - M06: Contactos & Libreta de Inversionistas
  - M07: Agenda & Citas (Sincronización RFC 5545 iCalendar)
  - M08: Reparto y Liquidación de Comisiones (Splits Agencia/Broker)
  - M09: Metas Mensuales y Proyecciones Ponderadas
  - M10: Quisqueya Academy LMS (Capacitación y Certificación Broker)
  - M11: Comunicaciones Multicanal (Telegram Bot API sin costo + WhatsApp Directo)
  - M12: Reportes & Business Intelligence (Exportación CSV RFC 4180)
  - M13: Auditoría y Trazabilidad Inmutable (`audit_log`)
  - M14: Dashboard Ejecutivo Multi-Rol (Admin, Broker, Asistente)
  - M15: Papelera Segura y Recuperación de Registros

## 2. Exclusiones Explícitas
- No desplegar automáticamente en VPS de producción.
- No activar pasarelas de pago externas no autorizadas.
- No depender de proveedores de mensajería con costos recurrentes abusivos; priorizar Telegram Bot API nativa y enlaces profundos `wa.me`.
