# Traspaso de orquestación (D00) · 2026-10-03

De: Claude (orquestador y revisor). Para: el siguiente orquestador (Antigravity u otro). Wilber decide quién
orquesta; solo puede haber **uno** a la vez (tres orquestadores simultáneos el 2-oct duplicaron trabajo y commits).

## 1. Cómo se orquesta (el método que se ha usado y funciona)

1. **Mandato antes de despachar.** Lee la petición, verifica el estado real (git log/status, pruebas) y escribe la
   tarea como archivo `.md` autocontenido: qué perfil, qué archivos puede tocar, criterios verificables, entregable.
2. **Despacha por perfil** con `tools/profile_dispatch.py` (nunca a mano, nunca con Laya):
   ```
   python tools/profile_dispatch.py <proyecto> --department Dxx --provider codex|antigravity|kimi|grok \
     --tier small|medium|large --mode analysis|fix [--worktree] [--skill patron-consola] [--gate Gn] \
     [--review-of HND-nnn] --task-file <tarea.md> --deliverable <ruta.md> --require "## Pruebas"
   ```
   - `--mode fix` + `--worktree` para construir: el agente trabaja aislado y devuelve `changes.patch`.
   - `--review-of HND-nnn` para revisar: exige `VEREDICTO:` y lo registra en el SDK.
   - El resultado queda en `<proyecto>/.viltrum/dispatch/<run>/result.json` (status, problems, warnings, patch).
3. **Productor y revisor siempre de proveedores distintos** (P4). Revisa también lo que el revisor aprueba
   rápido: si una revisión de 50 KB tarda 3 minutos, mira su sustancia.
4. **Verifica tú, no el informe** (P3): aplica el parche (`git apply --check`, luego `git apply`) y corre
   `npx tsc --noEmit`, `npm test`, `npm run build`. Para UI, mira la pantalla real en staging.
5. **Commit solo de lo aprobado y verificado** (regla 5 de CLAUDE.md), con mensaje que nombre productor,
   revisor y evidencia. Los agentes productores **no** hacen commit; si lo hacen, el despacho lo avisa: revísalo.
6. **Retroalimentación** (skill `retro-perfiles`): cada fallo de maquinaria se corrige en el despachador o en
   `registry/provider-routing.json` con una prueba en `tests/test_profile_dispatch.py`.

## 2. Estado de proveedores (3-oct, tarde)

| Proveedor | Estado | Uso |
|---|---|---|
| Codex (GPT-6.1 Sol / 6 Luna) | activo; cuota limitada | backend, datos, revisiones, research |
| Antigravity (gemini-3.1-pro-low, sin `--sandbox`) | activo; lento en tareas largas | QA con navegador, diseño, infraestructura |
| Grok | **402 saldo agotado** | — |
| Kimi | **límite mensual agotado** | — |
| Claude | cuota semanal casi agotada | — |

Antes de una tarea larga: `python tools/provider_probe.py <proyecto> --provider <p>` (eco, escribir, trabajar).

## 3. Entornos (todo es STAGING; producción no se toca sin Wilber)

- Túneles (un proceso PowerShell que se reconecta solo): `127.0.0.1:3101` CRM staging en la VPS ·
  `:54321` Supabase Auth (GoTrue) staging · `:55432` y `:55433` base `quisqueya-staging-db`. Si se caen,
  relanzar el bucle `ssh -N -L ...` (ver `QuisqueyaHome_CRM/docs/ops/crm-local-staging.md`).
- CRM staging: redesplegar con `bash scripts/deploy-staging-vps.sh` (solo despliega lo commiteado).
- Credenciales de prueba: `QuisqueyaHome_CRM/.env.agent.local` y `QuisqueyaHome PortalWeb/.env.agent.local`
  (ignorados por git). Nunca imprimirlas ni escribirlas en otro archivo.
- Rotación pendiente (humano): contraseña de `supabase_admin` (se expuso dos veces a proveedores externos).

## 4. CRM (`C:\Users\wilbe\Documents\QuisqueyaHome_CRM`, rama `develop`) — mapa de trabajo

### Hecho y commiteado
- Seguridad: ORQ-01 (acceso de evaluación solo dev+localhost+`CRM_EVAL_LOGIN=1`), F01–F04, F05–F06. 448/448 pruebas.
- Login real contra GoTrue de staging; CRM corriendo dentro de la VPS (sin ECONNRESET).
- Rediseño fase 1 (Antigravity, `d05f4ff`): shell de consola, barra lateral agrupada, paleta Ctrl+K, dock móvil.
- Evaluación de backend (`.viltrum/crm-ux/D10-backend-eval.md`), auditoría UX (`D04-crm-ux-audit.md`),
  topología VPS/Supabase (`D03-topologia-vps-supabase.md`), insumos de fase 1 (`D05-D03-D06-insumos-fase1.md`).

### En curso al cerrar
- D09 afinado (Codex): KPI 2×2 en móvil, fecha compacta, saludo con el usuario real → `tareas/t-crm-ui-fix.md`,
  entrega `D09-afinado-fase1.md`. Verificar parche y redesplegar.
- D21 Academy open source (Codex) → `tareas/t-academy.md`, entrega `D21-academy-opensource.md`. Revisar con
  otro proveedor (D03) y presentar la recomendación a Wilber.

### Pendiente, en orden
1. **QA del rediseño RECHAZADO** (`D14-qa-rediseno.md`, 61 capturas): QA-01 P0 formularios largos pierden estado
   sin red · QA-02 P1 tablas desbordan · QA-03 P1 doble clic sin guarda · QA-04 P1 foco y trampas de teclado en
   modales · QA-05 P2 estados vacíos sin acción · QA-06 P2 formato de divisas. → D09 (Codex) en worktree, solo
   vistas; luego D14 (Antigravity) repite el QA con `tareas/t-crm-qa.md`. Pendiente también: rol broker y axe-core.
2. **Backend P1 restantes**: F07 exclusividad de la unidad, F08 reportes que amplían alcance, F09 Confotur
   (`tareas/t-crm-p1b.md`, ajustar a F07–F09) y los P2 (F10–F12+) de la evaluación.
3. **Lint en rojo** (evaluación de backend): corregirlo antes de cualquier PR.
4. Fases siguientes del rediseño (pantallas restantes) con `--skill patron-consola`; cada una con insumos D05/D06/D03
   primero (D09 no implementa sin ellos — es correcto).
5. Topología definitiva (D03): proyectos Supabase Cloud por entorno requieren a Wilber (crear proyecto, claves).
6. El protocolo propio del CRM (`docs/R_RELEVO.md`, hito SOLID): no se añaden funciones nuevas sin decisión.

## 5. Quisqueya Portal + Studio (`QuisqueyaHome PortalWeb`, rama `main`, subido a GitHub)
- En verde: build y 73/73 pruebas; regresión de privacidad FIND-QA-08 corregida y reforzada.
- Sin commit, sin revisar: pantallas de cuenta de cliente (`src/portal/auth`, `src/portal/profile`) de otra sesión.
- Pendiente humano: firma de Ismael (`PRIVACIDAD-propuesta-Ismael.md`), ensayo de `supabase/proposals/`,
  idiomas RU/HT con verificación final, despliegue.

## 6. Trampas aprendidas (no repetir)
- `exit 0` no prueba trabajo; validar por contenido (`result.json` → `problems`). Parches vacíos = no hubo cambios.
- Antigravity: `--sandbox` cuelga comandos; `--mode plan` no escribe; `flash-high` da 503.
- Paquete completo de perfil (34 KB) empeora a modelos pequeños: tier small usa perfil ligero (A/B 1 y 2).
- Cabeceras del paquete: análisis permite leer y verificar; fix permite editar solo lo asignado.
- Agentes que escriben credenciales en archivos (`test.js` con `supabase_admin`): buscar y borrar antes de commit.
- Tareas derivadas por `sed`: revisar con grep que se aplicó la sustitución antes de despachar.
- Pruebas intermitentes: repetir una vez antes de declarar fallo; registrar la prueba inestable.
