# Estado: Login / Google / Correo

_Regenerado 2026-10-29 17:06 (hora RD, UTC-4). Sin secretos: las credenciales viven solo en el VPS._

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


## Guía OAuth
- [plan/GUIA-GOOGLE-OAUTH.md](../plan/GUIA-GOOGLE-OAUTH.md)
- Capturas: [Drive 06-Estado-Integraciones](https://drive.google.com/drive/folders/19Jf0_fX_JgyXnb3a7ZMuqwWxLIeSOHA8)
