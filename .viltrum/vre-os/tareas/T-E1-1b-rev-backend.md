# T-E1-1b-REV · Revisión independiente del backend de Negocios (b1 + b2)

Ficha: M03

Perfil: **D14 QA** con mirada **D12 Seguridad**. Productor: Codex. Revisor: Antigravity (otro proveedor, regla P4).
Modo: **solo lectura de código**; escribes únicamente `.viltrum/reviews/D14-revision-E1-1b-backend-2026-10-13.md`. No edites código, ni migraciones, ni la ficha. Sin git, sin `npm run dev`/`build`, sin `.env*`, sin tocar la VPS. Ejecutar comandos de verificación sí está permitido. Máximo 45 min.

## Entradas
Ficha `.viltrum/vre-os/spec/modulos/M03-negocios.md` (READY: §5, §8 CA-04, 05, 06, 07, 08, 09, 11, 12, 20, 21, 28, 29), decisión #47 (`docs/contexto/decisiones.md:311`), informes de Codex `.viltrum/vre-os/evidencia/E1/negocios/D10-b1-consultas.md` y `D11-D10-b2-cierre.md`, y el diff real (`git status`, `git diff` de `src/application/pipeline/**`, `src/infrastructure/db/**`, `src/app/api/pipeline/**`, `src/app/(crm)/negocios/**`, `drizzle/0004*`, `drizzle/0005*`, `scripts/test-db/**`, `src/domain/unidades.ts`).

## Qué comprobar (cada punto con evidencia archivo:línea o salida de comando)
1. **Reproduce tú mismo** `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:db`, `npm run spec:check`. Informa los números reales; si difieren de los de Codex, dilo.
2. **Mutación (CA-29):** ejecuta los comandos `test:db:mutation:*` que el informe documenta y confirma que cada mutación hace caer su prueba y que todo queda restaurado (`git status` sin cambios tuyos).
3. **Fuga de campos restringidos (CA-11):** busca por qué rutas puede llegar `realPriceCents`, comisión de terceros o `commissionBasisPoints` a un broker o asistente (SELECT, DTO, respuestas de PATCH/etapa/propiedades, errores, auditoría, outbox). Revisa en especial las respuestas de mutación de `src/app/api/pipeline/**`.
4. **Venta única (CA-08):** migración 0004/0005 y `cierre.ts`: `UNIQUE(unit_id)`, `UNIQUE(deal_id)`, `UNIQUE(project_id, unit_code_normalized)`, FK restrictivas sin cascade, RLS, CHECK; ¿una venta duplicada con otro formato del código (`a 101` vs `A-101`) queda rechazada? ¿La carrera de dos conexiones prueba lo que dice?
5. **Datos históricos (S-303-H):** la migración no inventa unidades, no toca los 15 legados y avisa la cuenta; la consulta de legado devuelve exactamente esos IDs.
6. **Transacción y outbox (CA-20/21):** un solo `NegocioCambioEtapa` por transición efectiva en la misma transacción; fallo del outbox revierte venta/comisión/metas; misma etapa no emite evento; el proveedor externo no es llamado.
7. **Pérdida y baja lógica (CA-07/09):** motivo activo + comentario no en blanco; ningún `DELETE` físico de negocios, contactos ni intereses.
8. **Arquitectura y seguridad (CA-04, CA-28):** `application/` no importa Drizzle/Next; permisos en servidor antes de leer datos; Zod en toda entrada; ID ajeno ⇒ 404 sin filtrar detalles; sin credenciales en archivos nuevos (`grep` de `postgres://`, `password`, `service_role`).
9. **Cambios fuera de alcance:** lista archivos modificados que no pertenezcan a Negocios y distingue lo que ya estaba sin commit desde el 9 de octubre (`tokens.css`, `globals.css`, vistas, `.viltrum/os`).

## Entrega
Resumen en 5 líneas, tabla de hallazgos (ID, severidad P0–P3, evidencia, corrección pedida, dueño), los 9 puntos con su resultado (CONFIRMADO / NO VERIFICADO / FALLA) y la última línea exacta:
`VEREDICTO: APROBADO` o `VEREDICTO: APROBADO CON CAMBIOS` o `VEREDICTO: RECHAZADO`.
«Aprobado» solo sin P0/P1 abiertos. Esto no es gate, C1 ni aceptación del cliente.
