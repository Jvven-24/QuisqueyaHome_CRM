# Correo transaccional propio (VPS)

- Postfix 3.8.6 + OpenDKIM 2.11 desde el archivo oficial de Ubuntu 24.04 (paquetes firmados por Canonical).
- Escucha solo en 127.0.0.1:25 y 172.16.1.1:25 (puente Docker `qh-dev`); no es relay abierto (`permit_mynetworks, reject`).
- Firma DKIM con selector `qh2026` (clave privada en /etc/opendkim/keys, nunca en el repo).
- El CRM envía con nodemailer a SMTP_HOST=172.16.1.1 (app.env). Los rebotes a no-reply se descartan.

## DNS requerido en quisqueyahome.com (Hostinger)
| Tipo | Nombre | Valor |
|---|---|---|
| TXT | @ | `v=spf1 ip4:2.24.106.76 -all` |
| TXT | qh2026._domainkey | `v=DKIM1; h=sha256; k=rsa; p=…` (ver /etc/opendkim/keys/quisqueyahome.com/qh2026.txt) |
| TXT | _dmarc | `v=DMARC1; p=quarantine; rua=mailto:wilber.alitoeirl@gmail.com; adkim=s; aspf=s` |
| A | mail | `2.24.106.76` |

PTR de 2.24.106.76 (panel VPS de Hostinger): `mail.quisqueyahome.com`.
