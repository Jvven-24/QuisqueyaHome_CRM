# Staging Local-First con GoTrue (CRM Quisqueya Home)

Este documento describe la configuracin de autenticacin local para el entorno de staging utilizando Supabase GoTrue ejecutado en la VPS, conectado a `quisqueya-staging-db`.

## Arquitectura

1.  **Base de datos:** `quisqueya-staging-db` en la VPS, red `quisqueya_staging`.
2.  **GoTrue (Auth):** Contenedor `supabase/gotrue:v2.189.0` en la misma red de la VPS.
3.  **Proxy:** Contenedor Caddy que mapea peticiones `/auth/v1/*` hacia GoTrue `9999` removiendo el prefijo, emulando a Supabase Kong.
4.  **Tneles SSH Locales:**
    -   `55432` / `55433`: Tnel directo a la base de datos PostgreSQL de staging (`quisqueya-staging-db:5432`).
    -   `54321`: Tnel directo al proxy Caddy (`quisqueya-crm-staging-auth-proxy-1:80`), exponiendo las rutas `/auth/v1/` para el cliente de Supabase SSR en el entorno local.

## Credenciales y Variables de Entorno

El archivo `.env` local (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) apunta al tnel SSH en `http://127.0.0.1:54321`. Los JWT han sido generados y firmados usando la clave secreta generada especficamente para este entorno de staging.
Los secretos nunca se commitean ni se registran en los logs.

## Usuarios de Prueba

Ejecutamos `node scripts/crear-usuario-prueba.mjs admin` para aprovisionar un usuario administrador real.
Las credenciales del usuario de prueba de staging estn almacenadas en `.env.agent.local` para que Codex o Nova puedan iniciar sesin real contra la URL de frontend configurada.

*Nota:* Durante la creacin del usuario, GoTrue esperaba `aud` con valor `''` (vaco), no `'authenticated'`. Esto fue ajustado en la base de datos para permitir el inicio de sesin de contrasea a travs de GoTrue de manera exitosa.

## Flujo de Inicio de Sesin

Al conectarse al CRM en `http://127.0.0.1:3001` con las credenciales de staging:
1.  Supabase SSR POST `/auth/v1/token?grant_type=password` hacia `127.0.0.1:54321`.
2.  El tnel SSH transfiere la peticin al proxy Caddy en la VPS.
3.  Caddy quita `/auth/v1` y enva a `gotrue:9999/token`.
4.  GoTrue valida el hash de `bcrypt` contra el esquema `auth` en `quisqueya-staging-db`.
5.  Devuelve el token JWT firmado, y el CRM avanza a `/inicio`.
