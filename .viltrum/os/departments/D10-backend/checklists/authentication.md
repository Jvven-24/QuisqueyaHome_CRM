# Checklist — autenticación

> Firma D12, nunca D10. Esta checklist escala con el riesgo del proyecto — no todo login
> necesita lo mismo, pero todo login pasa por aquí antes de declararse terminado.

## Estándares de referencia (verificados 2026-09-24)

- **OWASP ASVS v5.0.0** — Application Security Verification Standard, publicada 2025-05.
  Fuente oficial: `owasp.org/projects/asvs` y `asvs.dev/v5.0.0`. Reestructuró la versión 4
  a 17 capítulos y rebalanceó los niveles: **L1** (higiene básica, atacante oportunista),
  **L2** (la mayoría de aplicaciones con datos sensibles o lógica de negocio real), **L3**
  (alto valor, alta garantía — críticos, salud, transacciones de alto valor). Los niveles
  son acumulativos: L2 incluye L1, L3 incluye L2.
- **NIST SP 800-63B-4** — Digital Identity Guidelines: Authentication and Authenticator
  Management. Versión **final**, publicada 2025-07, sustituye a SP 800-63B (revisión 3).
  Fuente oficial: `pages.nist.gov/800-63-4` y `csrc.nist.gov/pubs/sp/800/63/b/4/final`.
  Define **AAL1** (un factor), **AAL2** (dos factores / MFA), **AAL3** (autenticador
  resistente a phishing, atado a hardware). Esta revisión integra autenticadores
  sincronizables (passkeys) como opción válida.
- **OWASP Password Storage Cheat Sheet** — `cheatsheetseries.owasp.org` (verificado
  2026-09-24), fuente de los parámetros de hash de esta checklist.

## Mapa de riesgo → nivel exigido

La tabla de riesgo R0–R4 es de `core/routing.md`. El mapeo a ASVS/AAL siguiente es
**interpretación de D10**, no una tabla oficial de OWASP ni de NIST — D12 la revisa y
puede ajustarla por proyecto.

| Riesgo (`core/routing.md`) | ASVS | AAL | Exige en concreto |
|---|---|---|---|
| **R0** — informativo, sin cuenta | L1 | — | Si no hay cuenta, esta checklist no aplica. Si aparece un login opcional, mínimo L1/AAL1 |
| **R1** — datos normales, sin dato personal sensible | L1 | AAL1 | Hash argon2id, política de longitud mínima, un factor permitido, sesión con expiración, sin lockout duro |
| **R2** — autenticación, roles o reglas de negocio reales | L2 | AAL2 | Todo lo de R1 + **MFA obligatorio** para cuentas con permisos de escritura, verificación contra contraseñas comprometidas, rotación de sesión al autenticar, CSRF si hay sesión con cookie |
| **R3** — pagos, datos personales o acciones irreversibles | L2 (mínimo) → L3 en rutas de pago/admin | AAL2 (mínimo) → AAL3 para acciones críticas | Todo lo de R2 + MFA obligatorio sin excepción, step-up de autenticación antes de acciones irreversibles, notificación de cambios de seguridad, gate humano por fase |
| **R4** — regulado, legal o alto impacto | L3 | AAL3 | Todo lo de R3 + autenticador resistente a phishing (passkey/WebAuthn o hardware) obligatorio, aprobación humana por fase, auditoría reforzada |

**Regla:** el nivel lo fija el dato y la acción más sensible del sistema, no el promedio.
Un sistema R1 con un solo endpoint de pago tiene ese endpoint en R3.

---

## A. Hash de contraseña

- [ ] **Argon2id** como algoritmo preferido. Parámetros mínimos recomendados (OWASP
      Password Storage Cheat Sheet, verificado 2026-09-24): memoria `m=19456` KiB (19 MiB),
      iteraciones `t=2`, paralelismo `p=1`. Alternativa con más memoria disponible:
      `m=47104` KiB, `t=1`, `p=1`
- [ ] Si Argon2id no está disponible en el stack: **scrypt** con costo mínimo `2^17`,
      bloque mínimo 8, paralelización 1
- [ ] Si ninguno de los dos está disponible (sistema legado): **bcrypt** con factor de
      trabajo ≥ 10, con límite de 72 bytes de contraseña considerado en el diseño
- [ ] Nunca MD5, SHA-1 ni SHA-256 sin función de derivación de clave — un hash rápido es
      una contraseña sin proteger
- [ ] La sal es única por contraseña y la genera el algoritmo, no la aplicación a mano
- [ ] La comparación del hash es en tiempo constante (la librería del algoritmo lo garantiza)

## B. Política de contraseñas moderna

- [ ] **Longitud mínima en vez de reglas de composición** — mínimo 8 caracteres, 15+
      recomendado para cuentas sin MFA; sin exigir mayúscula+número+símbolo obligatorios
- [ ] Longitud máxima generosa (64+), sin truncar en silencio
- [ ] Se permite cualquier carácter imprimible, incluyendo espacios
- [ ] **Verificación contra listas de contraseñas comprometidas** en registro y cambio de
      contraseña (ej. API de Have I Been Pwned en modo k-anonimato — nunca se envía la
      contraseña completa a un tercero)
- [ ] Sin rotación forzada periódica sin motivo (NIST 800-63B-4 la desaconseja salvo
      evidencia de compromiso)
- [ ] Medidor de fuerza es orientativo, no bloqueante sobre reglas de composición

## C. MFA — cuándo es obligatorio

- [ ] R0/R1: opcional, ofrecido
- [ ] R2 en adelante: **obligatorio** para cuentas con permisos de escritura o
      administración
- [ ] R3/R4: obligatorio sin excepción, y **step-up** (reautenticación) antes de acciones
      irreversibles o de alto valor (cambio de correo, cambio de MFA, pago, borrado)
- [ ] Métodos aceptados ordenados por resistencia: passkey/WebAuthn > TOTP en app
      autenticadora > SMS (solo como último recurso, nunca como único factor en R3/R4 —
      vulnerable a SIM swap)
- [ ] Códigos de respaldo de un solo uso, generados al activar MFA, con aviso de que se
      guarden fuera de línea

## D. Passkeys / WebAuthn

- [ ] Qué son: credenciales basadas en criptografía de clave pública, atadas al origen
      (dominio), resistentes a phishing por diseño — el navegador/autenticador no
      completa el desafío en un dominio falso
- [ ] Priorizar sobre contraseña + MFA cuando el stack y el público objetivo lo permiten
      (soporte de navegador maduro, usuarios con dispositivo compatible)
- [ ] Se ofrecen como **opción**, no como único método, salvo que el proyecto declare
      passwordless total con plan de recuperación equivalente
- [ ] Correspondencia con AAL3 de NIST 800-63B-4 cuando el autenticador está atado a
      hardware y es resistente a verificador falso — la base para exigirlo en R4

## E. Limitación de intentos sin lockout malicioso

- [ ] **Rate limiting progresivo por combinación IP + cuenta**, no bloqueo duro de la
      cuenta — un atacante no debe poder negar el servicio a la víctima con intentos
      fallidos repetidos
- [ ] Retraso creciente (backoff) en vez de bloqueo total tras varios intentos
- [ ] CAPTCHA u otra fricción adicional solo tras umbral de intentos sospechosos, no desde
      el primer intento
- [ ] Notificación al usuario tras patrón de intentos fallidos inusual, sin bloquear su
      acceso legítimo
- [ ] Los intentos fallidos quedan en el registro de eventos de autenticación (sección L)

## F. Enumeración de usuarios

- [ ] Mensaje de error **idéntico** en login para "usuario no existe" y "contraseña
      incorrecta" — ej. "correo o contraseña incorrectos"
- [ ] Mensaje de error idéntico en registro para "correo ya existe" — respuesta genérica
      tipo "si el correo no está registrado, se envió un enlace" en el flujo de
      alta/recuperación, sin confirmar existencia
- [ ] Tiempo de respuesta equivalente entre "usuario existe" y "usuario no existe" (evitar
      fuga por temporización)
- [ ] Mensaje de recuperación de contraseña no revela si el correo existe

## G. Recuperación de cuenta segura

- [ ] Token de un solo uso, de alta entropía, no adivinable
- [ ] Expiración corta (15–60 minutos según sensibilidad del proyecto)
- [ ] El token se invalida al usarse y al solicitar uno nuevo (el anterior queda inválido)
- [ ] El mensaje de "revisa tu correo" es idéntico exista o no la cuenta (ver sección F)
- [ ] El enlace de recuperación no autentica directamente — lleva a un formulario de
      nueva contraseña, que además exige el token válido
- [ ] Tras cambiar la contraseña, se cierra sesión en todos los demás dispositivos
      (sección K) y se notifica al correo registrado (sección M)

## H. Sesiones

- [ ] **Rotación del identificador de sesión al autenticar** — nunca reutilizar el ID de
      sesión anónima tras login (previene fijación de sesión)
- [ ] Expiración por inactividad, definida según riesgo (más corta en R3/R4)
- [ ] Expiración absoluta, independiente de la actividad
- [ ] Cookies de sesión: `HttpOnly`, `Secure`, `SameSite=Lax` o `Strict` según el flujo
      (nunca `SameSite=None` sin justificación explícita y sin `Secure`)
- [ ] El token de sesión no viaja en la URL ni en query string

## I. CSRF

- [ ] Aplica cuando la sesión se mantiene por cookie enviada automáticamente por el
      navegador; no aplica de la misma forma a APIs puramente Bearer-token sin cookie
- [ ] Token anti-CSRF en toda operación que muta estado desde un formulario con sesión de
      cookie
- [ ] `SameSite` de la cookie como primera línea de defensa, token anti-CSRF como segunda
      capa para R2+
- [ ] Verificación de origen (`Origin`/`Referer`) como defensa adicional, no como única

## J. OAuth 2.x / OIDC con PKCE

- [ ] **PKCE obligatorio** en todo flujo de autorización, incluso en aplicaciones
      confidenciales (recomendación vigente, no solo para SPA/móvil)
- [ ] `state` verificado para prevenir CSRF en el flujo de autorización
- [ ] Redirect URIs con lista blanca exacta, sin comodines amplios
- [ ] Tokens de acceso de vida corta; refresh tokens rotables y revocables
- [ ] Validación de audiencia (`aud`) y emisor (`iss`) del token en el backend, no solo la
      firma

## K. Cierre de sesión global

- [ ] Existe una acción que invalida **todas** las sesiones activas del usuario, no solo
      la actual
- [ ] Se dispara automáticamente en: cambio de contraseña, cambio de correo, activación o
      cambio de MFA, y sospecha de compromiso reportada
- [ ] La invalidación es efectiva del lado del servidor (revocación real), no solo borrar
      la cookie del cliente que la pidió

## L. Registro de eventos de autenticación

- [ ] Login exitoso — quién, cuándo, desde dónde (IP, agente de usuario)
- [ ] Login fallido — igual, sin registrar la contraseña ni datos sensibles en claro
- [ ] Cambio de contraseña, cambio de correo, activación/cambio de MFA
- [ ] Cierre de sesión global disparado
- [ ] Eventos de recuperación de cuenta solicitados y completados
- [ ] El registro es append-only y no editable desde la aplicación (coordinación con D11)

## M. Notificación de cambios de seguridad

- [ ] Correo al usuario cuando cambia: contraseña, correo de la cuenta, método de MFA
- [ ] El correo incluye cuándo y desde dónde ocurrió el cambio, y qué hacer si no fue el
      usuario
- [ ] La notificación se envía **incluso si el cambio fue legítimo** — no es una alerta de
      fraude, es evidencia

## N. Primer administrador

- [ ] El primer usuario con privilegios se crea por un procedimiento explícito **fuera**
      de la aplicación pública (script de aprovisionamiento, CLI, o flujo de invitación
      firmado) — nunca una cuenta admin/admin documentada en el README o en una migración
      con contraseña fija
- [ ] Si se genera una contraseña temporal, es de un solo uso y fuerza cambio inmediato en
      el primer ingreso
- [ ] La creación queda auditada como cualquier otra alta de usuario con privilegios
- [ ] MFA se activa en el mismo flujo de aprovisionamiento del primer admin, no después

---

## Veredicto

```
APROBADO      — checklist completa para el nivel de riesgo del proyecto
CONDICIONAL   — excepciones con dueño y fecha. Nunca con P0
RECHAZADO     — vuelve a D10 con hallazgos clasificados
```

Firma **D12**, nunca D10. En R3/R4 el veredicto requiere además aprobación humana
registrada (`core/lifecycle.md`, Gate por fase).
