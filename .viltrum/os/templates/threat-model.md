---
plantilla: threat-model
id: TM-nnn
proyecto: <id del proyecto>
departamento_dueno: D12
revisor: human            # registro: D12 → human
aprobador_humano:         # dueño del riesgo con autoridad que acepta el riesgo residual de §10 (D12 no lo acepta). Vacío hasta que firme; nunca lo rellena un agente
fase: F2                  # se revalida en F4–F6 (ver §11)
gate: G2                  # obligatorio desde R2; también sustenta G5 y G6
estado: borrador          # borrador · en_revision · aprobado · rechazado · superado
version: 0.1.0            # del documento; 1.0.0 = primera versión aprobada
fecha: AAAA-MM-DD
riesgo: R<n>
asvs_version: 5.0.0       # versión estable contra la que se citan los IDs
asvs_nivel: L1            # L1 (R2) · L2 (R3) · L2/L3 según sensibilidad (R4)
commit:                   # commit o entorno autorizado sobre el que se revisó
---

# TM-nnn · Modelo de amenazas — <sistema o módulo>

> STRIDE por flujo y por frontera de confianza. Sin inventario completo de entradas no hay
> modelo: una frontera desconocida es una pregunta bloqueante, no una superficie segura.
> D12 propone; no acepta riesgos altos ni excepciones legales y su informe no sustituye la
> firma humana ni autoriza producción.

## 0. Alcance y profundidad

| Riesgo | Profundidad exigida (D12) |
|---|---|
| R2 | STRIDE por flujo · ASVS L1 · hardening completo |
| R3 | + ASVS L2 · base legal por dato personal · cifrado en reposo obligatorio |
| R4 | + ASVS L2/L3 · revisión legal externa · aprobación por fase |

- Sistema o módulo cubierto: <…> · Excluido y por qué: <…>
- Commit y entorno autorizados: `<…>` · Arquitectura de origen: `RFC-nnn` · `ADR-nnn`

## 1. Activos

| ID | Activo (dato, función o credencial) | Clasificación (público · interno · personal · legal sensible pendiente de fuente jurídica) | Dueño (persona) | Dónde vive | Impacto si se compromete (P0–P3) |
|---|---|---|---|---|---|
| AST-001 | | | | | |

## 2. Actores

| ID | Actor (anónimo · usuario autenticado de rol X · usuario de otro tenant · administrador malicioso · sistema externo comprometido) | Capacidad | Precondición |
|---|---|---|---|
| ACT-001 | | | |

## 3. Flujo de datos y fronteras de confianza

Diagrama de flujo de datos: `<ruta>` → `EV-nnn`

| ID | Frontera | Qué la cruza | Confianza a cada lado |
|---|---|---|---|
| TB-001 | | | |

## 4. Inventario de entradas y flujos

> Cada entrada: formulario público, endpoint, webhook entrante, panel de administración,
> integración, importación o archivo, cola o job, herramienta de IA (si existe). Sin esta
> tabla completa, el STRIDE de §5 es incompleto por definición.

| ID | Flujo (entrada → validación → dominio → almacenamiento → salida) | Qué acepta (tipo · formato) | Quién la usa (rol · anónimo · sistema) | Autenticada (sí · no — cómo) | Qué toca después | Fronteras cruzadas |
|---|---|---|---|---|---|---|
| FLW-001 | | | | | | TB-nnn |

## 5. Amenazas (STRIDE por flujo)

**Cobertura:** una celda vacía es un flujo sin modelar. Se completa con `THR-nnn` o `N/A: razón`.

| Flujo | S Suplantación | T Alteración | R Repudio | I Divulgación | D Denegación de servicio | E Elevación de privilegio |
|---|---|---|---|---|---|---|
| FLW-001 | | | | | | |

| ID | Flujo | Categoría | Activo | Actor y precondición | Amenaza (qué intenta y qué pasa si lo logra) | Severidad (P0–P3) y justificación | Control (existente · pendiente: `CTL-nnn`) | ASVS (`v5.0.0-<id>`) | Prueba que lo demuestra (`TC-nnn`: el intento falla) | Dueño | Estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| THR-001 | | S · T · R · I · D · E | | | | | | | | | |

Estado según `core/evidence-contract.md`: No evaluado · En revisión · Con hallazgos · Corregido · Aprobado con evidencia · Bloqueado · Riesgo aceptado.

## 6. Controles y ASVS

> Un puntaje de scanner no demuestra cumplimiento ASVS. Los controles no aplicables conservan su motivo.

| ID | Control | Requisito ASVS (versión · id · nivel) | Estado (implementado · pendiente · `N/A: razón`) | Evidencia | Dueño |
|---|---|---|---|---|---|
| CTL-001 | | | | EV-nnn | |

## 7. Permisos (denegación por defecto)

| Actor o rol | Recurso | Acción | Tenant (propio · ajeno) | Permitido | Verificado en servidor y almacenamiento (prueba negativa `TC-nnn`) |
|---|---|---|---|---|---|
| | | | | sí · no | |

Se verifican: pertenencia del recurso, sesión expirada o revocada, privilegios administrativos, IDs alterados y acceso directo fuera de la interfaz. El aislamiento se prueba con identidades de mínimo privilegio; una conexión superusuario que ignora RLS no lo valida.

## 8. Privacidad

> D12 no interpreta la ley. La base legal la atribuye el cliente o su asesoría jurídica; lo
> pendiente va como `Q-nnn` en `.viltrum/questions.md`. No se clasifica un dato como
> categoría legal sensible sin fuente jurídica.

| ID | Dato personal | Finalidad (específica) | Necesidad | Origen | Destinatarios | Retención y borrado | Responsable (persona) | Base legal y quién la atribuyó | ¿Categoría legal sensible? (sí · no · pendiente de fuente) | `Q-nnn` |
|---|---|---|---|---|---|---|---|---|---|---|
| DP-001 | | | | | | | | | | |

## 9. Verificación técnica

> Un scanner ausente, un tiempo de espera agotado o un job omitido se registran como
> `no verificado`. El escaneo dinámico solo apunta a objetivos autorizados en sandbox o
> staging. Los reportes no incluyen claves ni datos reales.

| Herramienta (Gitleaks · Trivy/SBOM · CodeQL · ZAP · otra) | Versión y reglas | Alcance | Commit | Comando (sin secretos) | Fecha (UTC) | Código de salida | Reporte (ruta · sha256) | Resultado |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | EV-nnn | |

Cabeceras y TLS verificados sobre la respuesta del proxy real (no solo la configuración): `EV-nnn`

## 10. Hallazgos y riesgo residual

Hallazgos: cada `THR` con estado `Con hallazgos` o `Bloqueado` se lista con severidad, ubicación, reproducción, dueño y condición de cierre.

| ID | Amenaza (`THR-nnn`) | Por qué queda | Severidad | Control compensatorio | Dueño humano del riesgo (nombre) | ¿Aceptado? | Fecha | Enlace a la firma | Revisar el |
|---|---|---|---|---|---|---|---|---|---|
| RR-001 | | | | | | sí · no | | | |

Un P0 abierto congela la fase. Un riesgo alto o una excepción legal exige firma de un dueño con autoridad; D12 no la sustituye. Una exposición de secreto se remite a su dueño para rotación.

## 11. Revalidación

| Fecha | Disparador (entrada o integración nueva · cambio de permisos · dependencia crítica · incidente · G5 · G6) | Qué cambió | `THR` nuevos | Commit |
|---|---|---|---|---|
| | | | | |

## 12. Criterios de hecho (G2)

- [ ] Inventario de entradas y fronteras completo (§3–§4)
- [ ] STRIDE completo por cada flujo; ninguna celda vacía en la cobertura de §5
- [ ] Cada amenaza con severidad, control (existente o pendiente), dueño y prueba que intenta el ataque y falla
- [ ] Matriz de permisos con pruebas negativas de rol y de tenant
- [ ] Controles trazados a ASVS con versión y nivel; los no aplicables con motivo
- [ ] Secretos, dependencias y cabeceras con reporte, versión y commit; lo no ejecutado marcado `no verificado`
- [ ] Inventario de privacidad con base legal atribuida o pregunta abierta
- [ ] Cero P0 abiertos; riesgos altos con firma de su dueño humano
- [ ] Pruebas negativas entregadas a D14 y handoff a D16

## 13. Firmas

| Rol | Quién | Fecha | Handoff / revisión (`HND-nnn`) |
|---|---|---|---|
| Produce | D12 | | |
| Revisión independiente (registro) | humano distinto de quien produjo el modelo | | |
| Acepta el riesgo residual | `aprobador_humano` (frontmatter) | | enlace a la firma |

## Evidencia

> Solo artefactos generados por herramienta o aportados con fecha: reporte de scanner,
> diagrama versionado, respuesta HTTP real, prueba negativa en CI. "No se me ocurre un
> ataque" no cuenta (`core/evidence-contract.md`). Evidencia redactada: sin claves ni datos
> reales. Lo no verificado se escribe `no verificado` con su razón.
> Ruta relativa a la raíz del proyecto (normalmente `.viltrum/evidence/…`) y `sha256:<64 hex>`
> (`sha256sum <ruta>`) o SHA de commit. Sin ruta y hash, la fila no es evidencia.

| ID | Respalda | Tipo | Ruta o URL | sha256 / commit | Fecha (UTC) | Generada por |
|---|---|---|---|---|---|---|
| EV-001 | | | | | | |
