# Estado: Login / Google / Correo

_Regenerado 2026-10-27 10:18 (hora RD, UTC-4). Sin secretos: las credenciales viven solo en el VPS._

## Resumen (al 27-oct-2026 09:45 RD)
- **Login ID + clave**: activo; recuperación de contraseña por correo propio con canje en servidor y límites por IP/correo; nueva clave exige usuario activo y ≥8 caracteres.
- **Google**: inicio de sesión con Google solo para usuarios creados por el admin. Proyecto OAuth `quisqueya-crm-512913` (cuenta quisqueyahomedev), en modo prueba con un único usuario de prueba.
- **Correo**: relay SMTP propio (sin Resend) subido a las 09:41 RD. **Entrega a destinatarios externos aún por confirmar** (prueba real en curso: llegada, spam, enlace).
- **Live en VPS**: 20bb769; los commits de diseño/auth/correo están en la rama pero el deploy lo gestiona otro proceso.

## Correo: DNS y prueba real (27-oct-2026, 10:03 AM hora RD)
- Respaldo de la zona: /workspace/crm-plan/dns-backup-quisqueyahome-20261027.json (antes: @ A, crm A, www CNAME; no había MX ni TXT).
- Agregados vía API de Hostinger (overwrite=false; los registros existentes se conservaron): A mail→2.24.106.76; MX @ 10 mail.quisqueyahome.com; TXT @ "v=spf1 ip4:2.24.106.76 -all"; TXT qh2026._domainkey (DKIM, `opendkim-testkey`: key OK); TXT _dmarc p=quarantine, adkim=s, aspf=s.
- PTR: se pidió el cambio de srv1860290.hstgr.cloud a mail.quisqueyahome.com por la API de VPS (acción ipam_set_reverse iniciada); falta verificar que propague.
- Prueba recuperar → quisqueyahomedev@gmail.com: ACEPTADA por Gmail.
  `2026-10-27T14:03:14Z postfix/smtp: 09850308749: to=<quisqueyahomedev@gmail.com>, relay=gmail-smtp-in.l.google.com[142.250.31.26]:25, dsn=2.0.0, status=sent (250 2.0.0 OK ...)`
- Pendiente: confirmar en la cuenta de Gmail si llegó a la bandeja de entrada o a spam y si el enlace funciona. Ojo: con el MX nuevo, el correo entrante a @quisqueyahome.com rebota, porque Postfix solo escucha en local.

## Commits relacionados (rama codex/wilber-crm-20261026)

| Commit | Fecha (RD) | Mensaje |
|---|---|---|
| `bb6ae45` | 2026-10-27 09:41 | ops(vps): respaldo diario, chequeo de salud y documentación del relay de correo |
| `e224fe2` | 2026-10-27 09:41 | fix(auth): nueva clave exige usuario activo y mínimo 8 caracteres (revisión grok-build) |
| `57633b5` | 2026-10-27 09:36 | feat(auth): iniciar sesión con Google solo para usuarios creados por el admin (mismo callback, state 0) |
| `ab7ce2a` | 2026-10-27 09:36 | fix(auth): recuperación de contraseña por correo propio, canje en servidor y límites por IP/correo |
| `59e09b3` | 2026-10-27 09:36 | feat(correo): relay SMTP propio para invitaciones con enlace al CRM (nodemailer 10.2.1) |
| `f60a922` | 2026-10-27 07:27 | fix(google): callback vuelve al dominio público, no al host interno del proxy |
| `c78d481` | 2026-10-27 07:24 | feat(google): multi-cuenta por usuario con tokens cifrados, OAuth con state anti-CSRF, refresh, calendarios activables, predeterminado para visitas y revocación; agenda crea la visita en el calendario elegido |
| `04b27a0` | 2026-10-27 06:41 | feat(integraciones): adaptadores por env (WhatsApp YCloud/Cloud API, Resend, Meta webhook+CAPI, Google OAuth), webhooks firmados, prueba en modo test y estado en Configuración |
| `3ed6a70` | 2026-10-27 04:29 | fix(reservas): clave de outbox propia para HoldConvertido (la conversión hold → reserva daba 500 por outbox_idempotency_unq) |
| `899fa1f` | 2026-10-27 04:08 | fix(crm): permisos de reservas/holds, anti-escalada de roles, idempotencia en comisiones/metas, pack de tareas atómico, Academy sin autocertificación, No asistió cierra la cita, brokerId sin NaN y límites en login/leads externo/audio |
| `c8968ab` | 2026-10-27 01:40 | fix(login): POST nativo y submit bloqueado hasta hidratar para no exponer credenciales en la URL |

## Guía OAuth
- [plan/GUIA-GOOGLE-OAUTH.md](../plan/GUIA-GOOGLE-OAUTH.md)
- Capturas: [Drive 06-Estado-Integraciones](https://drive.google.com/drive/folders/19Jf0_fX_JgyXnb3a7ZMuqwWxLIeSOHA8)
