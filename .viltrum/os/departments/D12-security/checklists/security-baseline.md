# Checklist — línea base de seguridad de aplicación

> Se aplica a toda aplicación R1 o superior. Mapea a OWASP Top 10:2025, OWASP ASVS 5.0
> (nivel según riesgo) y OWASP API Security Top 10:2023 cuando hay API.
> Firma el revisor humano, nunca quien implementó.

## A. Control de acceso — OWASP A01:2025, ASVS cap. 4

- [ ] Todo endpoint verifica permiso en servidor, nunca solo en el cliente
- [ ] **Prueba que intenta cruzar el permiso y falla** (no solo "el permiso existe en el código")
- [ ] Referencia directa a objeto (IDOR) verificada: un usuario no puede leer/editar el recurso de otro cambiando un id en la URL
- [ ] Denegado por defecto — el permiso se otorga explícitamente, nunca se asume
- [ ] CORS restringido a orígenes conocidos, nunca `*` con credenciales
- [ ] Rutas de administración no accesibles por adivinar la URL — verificadas con rol, no con oscuridad

## B. Configuración segura — OWASP A02:2025

- [ ] Sin credenciales por defecto en ningún componente
- [ ] Mensajes de error genéricos al cliente; detalle completo solo en log interno
- [ ] Directorios y archivos de configuración no listables ni descargables
- [ ] Encabezados y funciones de depuración desactivados en producción
- [ ] Configuración por entorno (dev/staging/prod) separada y sin fuga entre ambientes

## C. Cadena de suministro de software — OWASP A03:2025

- [ ] SBOM generado y disponible
- [ ] Dependencias directas y transitivas escaneadas (Trivy o equivalente)
- [ ] Sin dependencia con vulnerabilidad crítica o alta sin mitigación documentada
- [ ] `lockfile` versionado; sin rangos abiertos en producción
- [ ] Pipeline de build verificado — sin paso que descargue código no auditado en cada build
- [ ] Imágenes de contenedor de una fuente conocida, con tag fijo, no `latest`

## D. Criptografía — OWASP A04:2025, ASVS cap. 9

- [ ] Contraseñas con función de hash lenta (Argon2id, scrypt o bcrypt), nunca reversible
- [ ] Comparación de secretos en tiempo constante
- [ ] TLS en todo tránsito, sin excepción, incluida comunicación interna entre servicios cuando cruza red no confiable
- [ ] Datos sensibles cifrados en reposo (definidos por D11)
- [ ] Sin algoritmo de cifrado obsoleto (MD5, SHA1 para integridad, DES)
- [ ] Claves de cifrado gestionadas fuera del código, con rotación posible

## E. Inyección — OWASP A05:2025, ASVS cap. 5

- [ ] Consultas parametrizadas o ORM — nunca concatenación de entrada del usuario en SQL
- [ ] Entrada validada por tipo, formato y rango antes de procesar
- [ ] Salida escapada según contexto (HTML, atributo, JS, URL) — previene XSS
- [ ] Comandos de sistema operativo nunca construidos con entrada del usuario sin lista blanca
- [ ] Deserialización de datos no confiables evitada o restringida a formatos seguros

## F. Diseño inseguro — OWASP A06:2025, ASVS cap. 1

- [ ] Modelo de amenazas existe para este sistema (`threat-model.md`)
- [ ] Límites de negocio con control técnico, no solo confianza (límite de intentos, de monto, de tasa)
- [ ] Flujos sensibles (recuperación de contraseña, cambio de rol, pago) con fricción proporcional al riesgo
- [ ] Perfil de amenaza revisado cuando el sistema gana una capacidad nueva

## G. Fallos de autenticación — OWASP A07:2025, ASVS cap. 6-7

- [ ] Bloqueo o fricción creciente ante intentos repetidos de acceso
- [ ] Sesión con expiración razonable y renovación segura
- [ ] Cierre de sesión invalida el token/sesión realmente, en servidor
- [ ] MFA disponible para cuentas con privilegio elevado, en R2+
- [ ] Recuperación de contraseña no revela si el correo existe; token de un solo uso con expiración corta
- [ ] Cookies de sesión: `HttpOnly`, `Secure`, `SameSite` apropiado

## H. Integridad de software y datos — OWASP A08:2025

- [ ] Actualizaciones y despliegues verificados por firma o checksum, no solo por URL
- [ ] Sin uso de CDN o script de terceros sin `Subresource Integrity` cuando es viable
- [ ] Pipeline de CI/CD con permisos mínimos, sin secretos expuestos a pasos de terceros
- [ ] Objetos serializados de fuentes externas no se deserializan directamente a ejecución

## I. Fallos de registro y alerta — OWASP A09:2025

- [ ] Eventos de seguridad relevantes se registran (login fallido, cambio de permiso, acceso a dato sensible)
- [ ] El registro no contiene contraseñas, tokens ni datos sensibles en claro
- [ ] Los registros son revisables y tienen retención suficiente para investigar un incidente
- [ ] Alerta activa ante patrón anómalo (fuerza bruta, escalamiento de errores 401/403)
- [ ] Handoff a D17 para la observabilidad continua

## J. Manejo de condiciones excepcionales — OWASP A10:2025

- [ ] Errores y excepciones no exponen trazas, rutas de archivo ni información interna al cliente
- [ ] Fallos parciales (timeout, servicio caído) no dejan el sistema en estado inconsistente
- [ ] Reintentos con límite — un error no dispara un bucle que agota recursos
- [ ] Casos límite (entrada vacía, muy grande, tipo inesperado) probados explícitamente, no solo el camino feliz

## K. API — OWASP API Security Top 10:2023 (si el sistema expone API)

- [ ] Autorización a nivel de objeto verificada por cada operación (API1)
- [ ] Autenticación de API no depende solo de un secreto en el cliente (API2)
- [ ] Autorización a nivel de propiedad — un campo que el rol no debe ver o editar, no se expone (API3)
- [ ] Límite de consumo de recursos por cliente: tasa, tamaño de payload, paginación obligatoria (API4)
- [ ] Autorización a nivel de función verificada, no solo de objeto (API5)
- [ ] Flujos de negocio sensibles (compra masiva, creación masiva de cuentas) tienen control adicional (API6)
- [ ] Peticiones salientes que el servidor hace por instrucción del cliente están validadas contra SSRF (API7)
- [ ] Validación de entrada estricta por endpoint, con esquema declarado (API8)
- [ ] Inventario de endpoints actualizado — sin endpoint "fantasma" fuera de documentación (API9)
- [ ] Datos de APIs de terceros consumidas se validan igual que entrada de usuario (API10)

## L. Cabeceras HTTP

- [ ] `Strict-Transport-Security` con `max-age` largo e `includeSubDomains`
- [ ] `Content-Security-Policy` restrictiva, sin `unsafe-inline`/`unsafe-eval` salvo excepción documentada
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options` o `frame-ancestors` en CSP contra *clickjacking*
- [ ] `Referrer-Policy` restrictiva
- [ ] `Permissions-Policy` limitando capacidades del navegador no usadas
- [ ] Cabeceras verificadas en una **respuesta real**, no solo en el archivo de configuración

---

## Veredicto

```
APROBADO      — checklist completa con evidencia
CONDICIONAL   — excepciones con dueño y fecha. Nunca con un hallazgo crítico o alto
RECHAZADO     — vuelve al departamento dueño con hallazgos clasificados
```

Firma el revisor humano. D12 no aprueba su propia configuración.
