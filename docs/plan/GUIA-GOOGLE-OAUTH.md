# Conectar Google Calendar al CRM (cliente OAuth)
1. console.cloud.google.com → proyecto nuevo "Quisqueya CRM" (id quisqueya-crm).
2. APIs y servicios → Biblioteca → habilitar Google Calendar API.
3. Google Auth Platform / Pantalla de consentimiento: Externo, app "Quisqueya Home CRM", email de soporte, dominio quisqueyahome.com, modo Prueba, agregar usuarios de prueba (cada cuenta que se conectará).
4. Acceso a datos (scopes): openid, userinfo.email, calendar.calendarlist.readonly, calendar.events. (Ver 2-scopes.webp)
5. Credenciales → Crear ID de cliente OAuth → Aplicación web "CRM Quisqueya". Origen JS https://crm.quisqueyahome.com ; redirección https://crm.quisqueyahome.com/api/integraciones/google/callback (Ver 3-cliente.webp)
[línea omitida: posible secreto]
7. En el CRM: Configuración > Integraciones o Agenda > "Mis calendarios de Google" → Conectar cuenta.
Notas: en modo Prueba, solo usuarios de prueba pueden conectar y el acceso vence a los 7 días; para producción, publicar la app y pasar la verificación de Google.
