# Arranque rápido — CRM Quisqueya Home + Claude Code

Pégale este archivo al chat de Claude Code (VS Code o desktop) al inicio de cada sesión de trabajo, o simplemente dile: "lee ARRANQUE_CLAUDE_CODE.md y retoma desde donde estamos".

---

## El proyecto

**CRM inmobiliario** para Quisqueya Home — empresa de corretaje en República Dominicana.  
Repo real: `D:\ViltrumTEK\Quisqueya_Home\QuisqueyaHome_CRM_clon-github`  
GitHub: `https://github.com/Jvven-24/QuisqueyaHome_CRM`  
Stack: **Next.js 15 · React 19 · TypeScript · Supabase (cloud) · Drizzle ORM · Zod**

---

## Cómo arrancar el servidor

```bash
npm run dev
```

Un arranque sano termina en `✓ Ready in ...` **en menos de 4 segundos**, y la primera página tarda unos 5 en compilar. Abre la URL que imprima la terminal — **léela, no la des por hecha**.

Supabase cloud ya está configurado en `.env`. No hay base de datos local que levantar.

**Para entrar al CRM** hay tres usuarios de prueba, uno por rol (admin, asistente y broker). Las credenciales están en `scripts/crear-usuario-prueba.mjs`, que además es idempotente: `node scripts/crear-usuario-prueba.mjs [admin|asistente|broker]` los recrea o repone la contraseña. Usa el admin: tiene 126 permisos, frente a 36 del asistente y 22 del broker.

### Si no arranca

- **Se queda en `✓ Starting...` y nunca llega a `Ready`.** No es lentitud. Casi seguro `.next/` tiene archivos que pertenecen a otro usuario de Windows (el sandbox de Codex) y el servidor gira al 100% de CPU sin poder sobrescribirlos. Diagnóstico y arreglo en `docs/contexto/errores-conocidos.md` §1, «Entorno de desarrollo (Windows)». Resumen: borrar `.next` desde una terminal **de administrador**.
- **Dice `Port 3000 is in use` y arranca en el 3001.** Hay un Node viejo vivo. En VS Code: Terminal > Ejecutar tarea > **Liberar puerto 3000** — ojo, esa tarea solo libera el 3000, no el 3001 — y vuelve a arrancar. Mientras haya dos servidores es facilísimo estar probando el que no es y ver 404 y 500 en rutas que funcionan.

---

## Estado actual del proyecto (corte: 2026-09-21)

| Fase | Milestone(s) | Estado |
|---|---|---|
| **F0** — Fundación | M0 Base, M1 Leads, M2 Negocios, M3 Contactos | ✅ Cerrada |
| **F1** — Núcleo comercial | M1–M3 completos, cierre transaccional real | ✅ Cerrada |
| **F2** — Operación diaria | M4 Actividades, M5 Propiedades, M13 Config/usuarios | ✅ Cerrada (74 pruebas en verde) |
| **F3** — Inventario y equipo | M6 Avances, M7 Brokers, M8 Metas, M9 Comisiones | ✅ Cerrada en `dev/jvven` (122 pruebas), PR a `develop` pendiente |
| **F4** — Agregadores | M10 Academy, M11 Comunicaciones, M12 Reportes, M14 Inicio, M15 Notificaciones | 🔲 Próxima |

**F2 ya está en `develop` (PR #29). F3 está construida y verificada** (ver `docs/F3_ESTADO.md`); falta abrir su PR, cerrar a mano los issues #30–#33 y confirmar con el cliente los umbrales de nivel de broker.

**Lo siguiente, antes de abrir F4 (acordado el 21/09/2026):** Jvven está probando el CRM a mano, pantalla por pantalla, y lo que salga de ahí se arregla en una **sesión dedicada a depurar el frontend**. El punto de partida de esa sesión es que el código y las pruebas ya están en verde —122 pruebas, `typecheck` y `lint` limpios—, así que los fallos que busca **no van a aparecer ahí**: son defectos que solo se ven usando la interfaz. No los busques en las pruebas unitarias. Los hallazgos se suman a `AUDITORIA_FUNCIONAL_CRM.md`, que sigue siendo el documento vivo de la auditoría.

---

## Flujo de trabajo acordado

Así trabajamos cada fase:

1. Yo digo **"vamos con F3"** (o el módulo específico)
2. Claude lee `docs/F2_ESTADO.md` (o el último estado) y el plan anterior
3. Claude genera el análisis, el plan con milestones e issues, y los escribe en `docs/F3_ANALISIS_Y_PLAN.md`
4. Yo apruebo o ajusto
5. Claude implementa issue por issue, con `/ponytail` para mantener el código limpio
6. Al cerrar la fase: `/ponytail-review` sobre cada diff, `/ponytail-audit` sobre el repo completo
7. Claude escribe `docs/F3_ESTADO.md` con lo que quedó hecho y verificado
8. Se abre el PR bundleado

**Ramas:** `dev/jvven` → PR → `develop` → (cuando estable) → `main`. Nunca directo a `develop` ni `main`.

---

## Documentos clave (leer antes de trabajar en esa área)

| Qué necesitas saber | Archivo |
|---|---|
| Estado detallado de lo último que se hizo | `docs/F3_ESTADO.md` |
| Plan de F2 (milestones, issues, decisiones) | `docs/F2_ANALISIS_Y_PLAN.md` |
| Arquitectura, stack, patrones del código | `docs/contexto/arquitectura.md` |
| Convenciones de código y estilo | `docs/contexto/convenciones.md` |
| Decisiones técnicas tomadas (39) | `docs/contexto/decisiones.md` |
| Trampas conocidas y cómo salir de ellas | `docs/contexto/errores-conocidos.md` |
| Configurar Supabase / base de datos | `docs/SUPABASE.md` |
| Deploy al VPS (pendiente, no urgente) | `docs/DESPLIEGUE.md` |

---

## Comandos útiles

```bash
npm run dev          # arrancar el servidor de desarrollo
npm run typecheck    # verificar tipos TypeScript
npm run test         # correr las 122 pruebas
npm run build        # build de producción (verifica errores reales)
npm run lint         # revisar estilo del código
```

---

## Cómo hablarme para que funcione igual que siempre

- **"Vamos con F3"** → leo el estado anterior, genero análisis y plan, te lo presento
- **"Verifica las milestones de F3"** → reviso qué está hecho vs. el plan
- **"Genera los issues de F3"** → creo los issues de GitHub con `gh issue create`
- **"Abre el PR de F2"** → genero el PR bundleado con los issues cerrados
- **"Retoma el orden"** → leo el último estado y continúo desde donde estábamos

No hace falta explicarme el proyecto de nuevo. Solo dime qué quieres hacer.

---

## Skills activos en este proyecto

Claude Code tiene estos workflows especiales cargados:

- `/ponytail` — analiza el diff antes de implementar, corta lo que sobra
- `/ponytail-review` — audita el diff al cerrar un issue
- `/ponytail-audit` — escanea el repo completo al cerrar una fase
- `/documentos-contexto` — regenera los 6 docs de `docs/contexto/`
