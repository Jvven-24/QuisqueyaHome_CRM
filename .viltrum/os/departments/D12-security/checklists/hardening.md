# Checklist — hardening de infraestructura

> Configuración profunda del servidor, contenedores, base de datos, proxy y TLS.
> Se aplica antes de cada release a producción (Gate G6) y ante cualquier cambio de
> infraestructura. Firma el revisor humano.

## A. Servidor Linux / VPS

- [ ] Acceso SSH **solo por llave** — contraseña deshabilitada en `sshd_config`
- [ ] Usuario root deshabilitado para login remoto directo (`PermitRootLogin no`)
- [ ] Puerto SSH no expuesto sin necesidad, o cambiado del 22 por defecto solo como capa extra (nunca como único control)
- [ ] Firewall activo (`ufw`/`nftables`/equivalente del proveedor) con política de denegar por defecto
- [ ] Solo puertos estrictamente necesarios abiertos (80/443 públicos; el resto restringido por IP o VPN)
- [ ] Actualizaciones de seguridad automáticas activas (`unattended-upgrades` o equivalente)
- [ ] `fail2ban` (o equivalente) activo sobre SSH y cualquier servicio con login público
- [ ] Usuarios del sistema con privilegio mínimo — nadie opera como root para tareas rutinarias
- [ ] `sudo` auditado — quién puede, y queda registrado
- [ ] Zona horaria y NTP sincronizados — los registros de auditoría dependen de esto
- [ ] Swap y límites de recursos configurados para evitar que un proceso tumbe el servidor entero

## B. Docker / contenedores

- [ ] Los contenedores corren con **usuario no root** dentro de la imagen
- [ ] Imágenes base mínimas (`slim`, `alpine`, *distroless*) — menos superficie, menos CVEs heredados
- [ ] Imágenes escaneadas (Trivy) antes de desplegar, sin críticos/altos sin mitigar
- [ ] Sin secretos incrustados en la imagen ni en variables de build visibles en capas
- [ ] Límites de CPU y memoria declarados por contenedor — evita que uno agote el host
- [ ] Volúmenes con permisos mínimos; sin montar el socket de Docker dentro de un contenedor salvo necesidad justificada
- [ ] Red de contenedores segmentada — el contenedor de base de datos no expone puerto público directo
- [ ] `docker-compose`/manifiesto versionado, sin `:latest` en producción
- [ ] Registro de imágenes con control de acceso, no público sin razón

## C. PostgreSQL / Supabase

- [ ] Row Level Security (RLS) activo en toda tabla con datos por usuario o por tenant
- [ ] **Prueba que intenta cruzar el aislamiento entre tenants y falla**
- [ ] Rol de la aplicación con privilegio mínimo — no usa el rol de superusuario/owner
- [ ] Conexiones cifradas (`sslmode=require` o superior), nunca texto plano
- [ ] Credenciales de base de datos fuera del código, rotables
- [ ] Extensiones instaladas revisadas — ninguna innecesaria habilitada por defecto
- [ ] Respaldo automático activo y **restauración ensayada con fecha** (coordinado con D11)
- [ ] Puerto de base de datos no expuesto públicamente; acceso solo desde la red de aplicación o VPN
- [ ] Auditoría de conexión — se sabe quién se conectó, cuándo y desde dónde
- [ ] `pg_hba.conf`/reglas de acceso de Supabase revisadas — sin regla `trust` ni acceso amplio innecesario

## D. Proxy inverso y TLS

- [ ] Certificado TLS válido, renovación automática verificada (no solo configurada)
- [ ] Protocolo mínimo TLS 1.2, preferente TLS 1.3; protocolos y cifrados obsoletos deshabilitados
- [ ] Redirección forzada de HTTP a HTTPS en todo el dominio
- [ ] `Strict-Transport-Security` enviado desde el proxy, verificado en respuesta real
- [ ] Tamaño máximo de petición limitado — evita abuso de payloads gigantes
- [ ] Timeouts de proxy configurados — una conexión colgada no agota *workers*
- [ ] Cabeceras de proxy (`X-Forwarded-For`, etc.) validadas — no confiar ciegamente en cabeceras que el cliente puede falsificar
- [ ] Rate limiting a nivel de proxy o gateway, con almacén compartido si hay más de una instancia de aplicación

## E. Cabeceras HTTP completas

Verificadas en una respuesta real del sistema desplegado, no en el archivo de configuración:

- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains` (agregar `preload` solo si se entiende la irreversibilidad)
- [ ] `Content-Security-Policy` con política restrictiva por directiva (`default-src`, `script-src`, `style-src`, `img-src`, `connect-src`, `frame-ancestors`)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` o más restrictiva
- [ ] `Permissions-Policy` deshabilitando cámara, micrófono, geolocalización salvo que se usen
- [ ] Cookies con `Secure`, `HttpOnly` y `SameSite=Lax` o `Strict` según el flujo

## F. Secretos y variables de entorno

- [ ] Gestor de secretos dedicado (no archivo plano en el servidor sin cifrar)
- [ ] Variables de entorno de producción no visibles en logs ni en paneles de error
- [ ] Acceso a secretos auditado — quién los leyó y cuándo
- [ ] Rotación de credenciales posible sin downtime, ensayada al menos una vez

## G. Copias de seguridad y continuidad

- [ ] Frecuencia de respaldo acorde a cuánto se puede perder (coordinado con D11)
- [ ] Respaldos cifrados, almacenados fuera del mismo servidor
- [ ] **Restauración completa ensayada, con fecha del último ensayo**
- [ ] Procedimiento de recuperación documentado y accesible sin depender de una sola persona

---

## Veredicto

```
APROBADO      — checklist completa con evidencia verificada en el sistema real
CONDICIONAL   — excepciones con dueño y fecha. Nunca con SSH por contraseña, RLS ausente
                en dato multi-tenant, ni secretos en el repositorio
RECHAZADO     — vuelve a infraestructura con hallazgos clasificados
```

Firma el revisor humano. Ninguna verificación de este checklist se da por buena solo porque
"así quedó configurado" — se prueba contra el sistema real.
