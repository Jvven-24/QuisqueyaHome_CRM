# QA Integraciones CRM — 27 oct 2026 6:35 AM (hora RD)
## Estado (app.env del VPS, solo se miró si cada valor existe, sin leerlo)
| Integración | Variables | Estado |
|---|---|---|
| WhatsApp Cloud API | WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID | VACÍO: el CRM no está conectado (YCloud está solo en el bot Viltrum) |
| Meta/IG/Pixel/CAPI | META_APP_ID/SECRET/PAGE_ACCESS_TOKEN/WEBHOOK_VERIFY_TOKEN | VACÍO |
| Google OAuth (Calendar/Drive/login Google) | GOOGLE_OAUTH_CLIENT_ID/SECRET | VACÍO |
| Email (recuperar contraseña, invitaciones) | SMTP_* / RESEND_API_KEY | VACÍO: el reset no puede enviar correos |
## Auth
- /login 200 OK. /api/health 200.
- /register: no existe la ruta (redirige a login). Es un CRM interno: el admin crea los usuarios.
- Recuperar contraseña: la ruta es /recuperar; /forgot-password no existe. No se pueden enviar correos sin SMTP/Resend.
## Antigravity: no tiene CLI en Linux, es una app de escritorio.
## Falta de Wilber
1. Una API key de Resend (con el dominio quisqueyahome.com verificado) o credenciales SMTP.
2. Un cliente OAuth de Google Cloud (Calendar+Drive) con redirect https://crm.quisqueyahome.com/api/... 
3. Token y phone_number_id de WhatsApp para el número del CRM, o decidir si se usa YCloud.
4. Meta App ID/Secret, Page token y verify token.
5. Decidir si quiere registro público.
