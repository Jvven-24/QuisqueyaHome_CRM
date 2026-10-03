# Hallazgos del orquestador · CRM · 2026-10-03

Revisor: Claude (D00). Para revisión D12 y decisión de Wilber. Nada de esto está commiteado.

## ORQ-01 · P1 · Atajo de autenticación por cookie sin contraseña (sin commit, autor: otra sesión)
- `src/middleware.ts` y `src/infrastructure/auth/actor.ts` (modificados 11:55–11:57, antes del despacho D16) aceptan la
  cookie `qh_dev_role` como sesión cuando `NODE_ENV !== "production"` **o** `CRM_DEMO_MODE === "true"`, y conceden
  todos los permisos (`assistant` con alcance `all`).
- Escenario: si `CRM_DEMO_MODE=true` llega a un entorno desplegado, cualquiera que fije la cookie entra como admin.
  Rompe la regla del repo (toda ruta con `requireScope`; sin atajos) y P4/P7.
- Recomendación: no commitear; si se quiere un modo de evaluación, limitarlo a `NODE_ENV=development` y host local,
  con prueba que falle si se activa en producción, y revisión D12.

## ORQ-02 · P2 · `.env` local con `NEXT_PUBLIC_SUPABASE_URL` apuntando a la propia app (D16 Antigravity)
- Evita que el login se cuelgue, pero la autenticación real no funciona; el acceso que D16 verificó usa ORQ-01.
- Solución correcta: topología de D03 (`D03-topologia-vps-supabase.md`): proyecto Supabase Cloud de desarrollo creado o
  confirmado por Wilber y sus claves en `.env` por canal privado.

## Lección para el entrenamiento (retro-perfiles)
- D16 declaró "verificado" un acceso que dependía de un atajo ajeno: verificar el mecanismo, no solo el código 200.
- Varias sesiones editan el CRM sin coordinación pese al protocolo de `docs/R_RELEVO.md` (un solo escritor).
