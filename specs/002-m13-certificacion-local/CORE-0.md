---
id: M13-CORE-0
parent_spec: specs/002-m13-certificacion-local/spec.md
contract_id: C1:M10
estado: VERIFIED
nivel: L2
owner: D03
revisores: [D12, D14]
actualizado: 2026-10-04
---

# CORE-0 · Retirar la autocertificación derivada

Subcontrato local y separable. Corrige la afirmación de certificación creada por el progreso de contenidos; no crea curso, decisión, constancia, migración ni integración LMS. Los registros de progreso existentes se conservan. M13-CORE y CORE-1..5 continúan DRAFT. D12 y D14 aprobaron el contrato documental; el dueño aprobó marcar solo CORE-0 `READY` en la respuesta registrada en `.viltrum/reviews/HUMAN-revision-HND-040-CORE-0-2026-10-04.md`. CORE-0A/B/C se integraron en el checkout local, pasaron 515 pruebas unitarias, 130 pruebas DB, typecheck, lint y build, y recibieron revisión de código D12/D14 aprobada en HND-043/HND-042. La evidencia reproducible está en `.viltrum/reviews/CORE-0-verificacion-integrada-2026-10-04.md`. No hubo push ni despliegue.

## Decisión de contrato

`ResumenProgresoAcademy` representa exclusivamente progreso educativo. **Eliminar `isCertified` del tipo, de todos los objetos que implementan ese tipo y del JSON `resumen` de `GET /api/academy`**. No devolver `false`, `null` ni un campo sustituto de certificación: antes de existir decisiones Admin, `false` podría confundirse con una decisión negativa y cambiaría silenciosamente el significado del booleano cuando llegue CORE-1..5. El JSON de `resumen` queda exactamente con `totalItems`, `completedItems` y `percent` como campos de este contrato. `GET /api/academy` conserva `ok` y `contenidos`; no cambia autenticación ni permisos.

En la UI, `ResumenAcademyVista` sigue la misma forma. `percent === 100` solo significa «Contenido completado»; `0` y vacío significan progreso inicial. No aparece «Broker Certificado», «Acreditado oficialmente», certificado, constancia ni una aprobación implícita. Antes de existir una solicitud, se prohíbe también «Certificación pendiente de revisión»: implicaría una revisión iniciada que el sistema no registra. A 100% usar «Contenido completado» y un texto neutral sobre el avance educativo, sin prometer solicitud, revisión ni acreditación. En este lote no se presenta estado aprobado, porque todavía no existe una decisión Admin consultable. CORE-1..5 deberán añadir un recurso de constancia por curso/versión con contrato propio; no reintroducirán el booleano en el resumen de progreso.

**Motivo y radio de impacto observado:** `puertos.ts` define el booleano; `en-memoria.ts` y `db/repos/academy.ts` lo calculan desde 100%; `vista.tsx` lo recalcula tras interacción y muestra la insignia; `casos-de-uso.test.ts` exige `true`; `GET /api/academy` serializa el resumen del repositorio. La búsqueda local de usos en `src/` no encontró otros consumidores de `isCertified` al redactar esta ficha. Repetir el inventario antes de editar; no inferir cobertura total del índice GitNexus.

Antes del corte, inspeccionar en modo lectura si outbox, logs, caché o exportaciones persisten o retransmiten payloads con `isCertified`. Registrar ruta, productor/consumidor y si el dato es histórico o se genera todavía; no modificar, borrar ni migrar esos datos en CORE-0. Si aparece un productor activo fuera de los archivos permitidos, detener el despacho y pedir a D00 un contrato acotado para cerrar esa salida antes de publicar.

## Tareas cerradas, cada una ≤45 minutos

El productor usa worktree aislado. Las listas son límites máximos; D00 emite tareas con archivos exactos. No publicar un estado intermedio: los tres cambios se entregan juntos como un corte visible. Si una tarea excede 45 minutos, detener y dividir el contrato antes de ampliar archivos.

| Tarea | Archivos permitidos | Salida comprobable |
|---|---|---|
| CORE-0A · Quitar la falsa afirmación visual | `src/app/(crm)/academy/vista.tsx` | `ResumenAcademyVista` sin `isCertified`; recálculo local solo de progreso. A 0%, vacío y 100% tras interacción, no hay insignia ni texto de aprobación. Recarga conserva esa semántica. |
| CORE-0B · Retirar el campo del productor y corregir oráculo | `src/application/academy/puertos.ts`, `src/application/academy/en-memoria.ts`, `src/infrastructure/db/repos/academy.ts`, `src/application/academy/casos-de-uso.test.ts` | Tipo, doble y repositorio DB devuelven solo conteos/porcentaje. Invertir la prueba que espera `true` a 100%; comprobar ausencia de clave para 0%, 100% y vacío, no solo valor falso. |
| CORE-0C · Verificar frontera HTTP y corte conjunto | `src/app/api/academy/route.ts` y una prueba nueva `src/app/api/academy/route.test.ts` **solo si** el harness local permite actor/repositorio de prueba sin cambiar archivos fuera de esta lista; sin eso, captura HTTP auditable de integración externa a código | `GET /api/academy` responde `resumen` sin `isCertified` a 0% y 100%; comprobar 401 sin sesión y 403 sin `academy:view` antes y después del cambio. Verificar vista tras acción local y tras recarga. No alterar ruta si ya serializa correctamente el objeto nuevo. |

El orden permite implantar primero la compuerta visual, pero **ninguna subtarea aislada se despliega**. Si el test HTTP exige un cambio de harness fuera de estos archivos, D00 abre un contrato adicional con revisión antes de implementarlo; no se amplía el permiso implícitamente.

## Oráculos positivos y negativos

1. Progreso inicial con contenidos: `percent=0`, `completedItems=0`; JSON y tipo carecen de `isCertified`; UI expresa solo avance.
2. Todos los contenidos completados: `percent=100`, `completedItems=totalItems`; JSON y tipo siguen sin `isCertified`; UI dice «Contenido completado» y no concede certificado, tanto inmediatamente como tras `GET`/recarga.
3. Catálogo vacío: `totalItems=0`, `completedItems=0`, `percent=0`; nunca se interpreta como 100% ni como certificado.
4. Completar un ítem/checklist y cambiar filtros no crea campo, badge ni constancia; error o falta de conexión tampoco muestra éxito de certificación.
5. Regresión negativa: la prueba que actualmente espera `isCertified=true` a 100% falla hasta ser invertida; buscar literalmente `isCertified`, «Broker Certificado» y «Acreditado oficialmente» en código Academy antes de cerrar. No aceptar reemplazar `true` por `false` manteniendo el campo.
6. Autorización sin regresión: `GET /api/academy` devuelve 401 para anónimo y 403 para actor sin `academy:view`, antes y después del corte; no expone `resumen` en esas respuestas.

## Verificación y límites

Ejecutar `npm run typecheck`, `npm run lint`, `npm test` y `npm run test:db` si se incorpora prueba DB. Para la UI, evidencia de 0%, 100%, vacío y recarga en navegador local. Si no hay prueba HTTP automatizada, conservar captura HTTP auditable con fecha, comando o solicitud reproducible, estado, cuerpo relevante redactado y resultado esperado/observado para 0%, 100%, 401 y 403; no incluir cookies, tokens ni PII. Registrar fallos ajenos y no presentarlos como verde. D12 revisa que no haya nueva inferencia de certificación ni exposición accidental; D14 comprueba oráculos positivos/negativos de API y UI en sesión independiente. D00 registra el resultado y solo entonces puede promover CORE-0 por separado. El resto del núcleo requiere el modelo D11, sus revisiones y su propia decisión de despacho.
