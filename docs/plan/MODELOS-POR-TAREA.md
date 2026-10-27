# Modelos por tarea — equipo IA CRM (27/10/2026)

## Inventario real
- **Codex 0.164.0** (caché de modelos): gpt-6-astra (frontera), gpt-6.1-sol (workhorse actual), gpt-6.1-terra, gpt-6-sol, gpt-reserve (rápido/agéntico), gpt-6-luna (rápido/barato), gpt-5.6-sol, gpt-5.6-terra, gpt-5.6-luna, codex-auto-review (interno). Todos probados OK salvo codex-auto-review.
- **Claude Code 2.1.301** (ids en el binario): claude-opus-5-5, claude-opus-5, claude-opus-4-8/4-7/4-6/4-5…, claude-sonnet-5-5, claude-sonnet-5, claude-sonnet-4-6/4-5…, claude-haiku-4-5. Probados OK: opus-5-5, opus-5, opus-4-8, sonnet-5-5, sonnet-5, sonnet-4-6, haiku-4-5.
- **Gemini CLI 0.65.0** (sin login, no probados): gemini-3.8-flash, gemini-3.5-flash, gemini-3.5-flash-lite, gemini-3.1-pro(-preview), gemini-3.1-flash-lite, gemini-3-pro/flash, gemini-2.5-pro/flash.
- No existen: "Luna 5.5" (Claude) → claude-sonnet-5-5; "Argon 4" (Gemini); Grok/Cursor "build" (no hay CLI instalado).

## Asignación
| Sección | Principal | Alternos | Por qué | Verificado |
|---|---|---|---|---|
| Arquitectura/planificación | gpt-6-astra (`codex -p arquitectura`) | claude-opus-5-5 (`claude-arq`), gemini-3.1-pro | Máximo razonamiento | Sí (Gemini no) |
| Backend | gpt-6.1-sol (`codex -p backend`) | claude-sonnet-5-5 (`claude-backend`), gpt-6-sol | Workhorse de código | Sí |
| Frontend/UI | claude-sonnet-5-5 (`claude-ui`) | gpt-6.1-terra (`codex -p frontend`), gemini-3.8-flash | Buen criterio visual + iteración | Sí (Gemini no) |
| Revisión/seguridad | claude-opus-5-5 (`claude-review`) | gpt-6-astra (`codex -p review`), claude-opus-4-8 | Dos familias distintas cruzan hallazgos | Sí |
| QA/E2E | gpt-6.1-sol (`codex -p qa`) | claude-sonnet-5 (`claude-qa`), gemini-3.5-flash | Escribir/correr Playwright | Sí (Gemini no) |
| Rápidas/refactors | gpt-reserve (`codex -p rapido`) | claude-haiku-4-5 (`claude-rapido`), gpt-6-luna, gemini-3.5-flash-lite | Velocidad/costo | Sí (Gemini no) |
| Documentación | gpt-6-luna (`codex -p docs`) | claude-sonnet-4-6 (`claude-docs`), gemini-3.8-flash | Barato, buena redacción | Sí (Gemini no) |

Defaults: Codex gpt-6-luna (+ `-p sol` = gpt-6.1-sol); Claude claude-opus-5-5; Gemini gemini-3.8-flash.
Config: ~/.codex/config.toml + ~/.codex/<perfil>.config.toml (formato nuevo de Codex), alias en ~/.bashrc, ~/.claude/settings.json, ~/.gemini/settings.json. VPS: perfiles Codex + default Gemini (sin Claude).
