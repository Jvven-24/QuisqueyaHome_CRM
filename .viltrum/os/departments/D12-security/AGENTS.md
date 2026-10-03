# D12 — Método operativo

## Contrato de entrada

De D03: módulos, límites, puntos de entrada al sistema, integraciones externas, decisiones
irreversibles.

De D11: modelo de datos, qué es dato personal, dónde vive, políticas de acceso por fila.

De D01/D02: base legal de cada dato personal recolectado, roles y permisos de negocio.

De D16: topología de infraestructura (VPS, contenedores, proxy, dominios).

**Sin el inventario de puntos de entrada, no modelo amenazas.** Un modelo de amenazas sobre
un sistema que no conozco completo es una lista de deseos, no un análisis.

**Profundidad según riesgo (`core/routing.md`):**

| Riesgo | Qué corro |
|---|---|
| R0 | Higiene básica: cabeceras, TLS, dependencias. Sin modelo de amenazas formal |
| R1 | + secretos, permisos, validación en tres capas |
| R2 | + modelo de amenazas STRIDE, ASVS nivel L1, hardening completo |
| R3 | + ASVS nivel L2, revisión de base legal por dato, cifrado en reposo obligatorio |
| R4 | + ASVS nivel L2/L3 según sensibilidad, revisión legal externa, aprobación por fase |

---

## Procedimiento

### 1. Inventariar puntos de entrada

Para cada uno: formulario público, endpoint de API, webhook entrante, panel de
administración, integración de terceros, cola o job programado.

```
ENTRADA: <nombre>
QUÉ ACEPTA: <tipo de dato, formato>
QUIÉN LA USA: <rol, anónimo, sistema externo>
QUÉ TOCA DESPUÉS: <servicios, tablas, colas>
AUTENTICADA: <sí/no — cómo>
```

Salida: tabla de entradas. Sin esto no hay modelo de amenazas.

### 2. Modelar amenazas — STRIDE por entrada

Aplico `checklists/threat-model.md`. Por cada entrada del paso 1, las seis categorías:

| Categoría | Pregunta |
|---|---|
| **S**poofing | ¿Puede alguien hacerse pasar por otro usuario o sistema? |
| **T**ampering | ¿Puede alterarse un dato en tránsito o en reposo sin detectarse? |
| **R**epudiation | ¿Puede negarse haber hecho una acción, por falta de registro? |
| **I**nformation disclosure | ¿Puede verse un dato que no le correspondía a quien lo vio? |
| **D**enial of service | ¿Puede agotarse un recurso y tumbar el servicio para otros? |
| **E**levation of privilege | ¿Puede un rol bajo alcanzar permisos de un rol alto? |

Cada amenaza identificada: severidad, control que la mitiga (existente o pendiente), dueño.

### 3. Línea base de aplicación

Aplico `checklists/security-baseline.md`. Cubre OWASP Top 10 vigente y ASVS del nivel que
corresponda al riesgo.

### 4. Hardening de infraestructura

Aplico `checklists/hardening.md`: servidor Linux, Docker, PostgreSQL/Supabase, proxy/TLS,
cabeceras HTTP.

### 5. Gestión de secretos

- [ ] Ningún secreto en el repositorio, histórico incluido (`gitleaks` sobre todo el historial)
- [ ] Secretos en gestor dedicado, nunca en `.env` versionado
- [ ] Rotación posible sin cambio de código
- [ ] `.env.example` con nombres de variable, nunca con valores reales
- [ ] Un secreto que se filtró se **rota**, no solo se elimina del repositorio

### 6. Dependencias y cadena de suministro

- [ ] SBOM generado (`trivy`, o equivalente disponible en el stack)
- [ ] Escaneo de vulnerabilidades conocidas en dependencias directas y transitivas
- [ ] Ninguna dependencia con vulnerabilidad crítica o alta sin plan de mitigación
- [ ] Origen de cada dependencia verificable (registro oficial, no un fork sin mantenimiento)
- [ ] Versión fijada (*lockfile*), no rango abierto en producción

### 7. Análisis estático y dinámico

| Herramienta | Qué cubre | Cuándo |
|---|---|---|
| Gitleaks | Secretos en el repositorio | Cada cambio, antes de integrar |
| Trivy | Dependencias, imágenes de contenedor, SBOM | Cada cambio y build de imagen |
| CodeQL | Patrones de código vulnerable (inyección, taint) | Cada cambio |
| OWASP ZAP | Superficie dinámica de la aplicación corriendo | Pre-release, R2+ |

Un hallazgo de severidad crítica o alta de cualquiera de estas herramientas **bloquea** el
Gate correspondiente hasta que se corrige o se acepta el riesgo por escrito.

### 8. Privacidad y base legal (Ley 172-13, y RGPD si hay usuarios en UE)

Por cada dato personal identificado por D11:

- [ ] Base legal declarada (consentimiento, ejecución de contrato, obligación legal, interés legítimo)
- [ ] Finalidad específica, no genérica
- [ ] Proporcionalidad: se recolecta lo necesario, no lo disponible
- [ ] Derecho de acceso, rectificación y eliminación implementable
- [ ] Dato sensible (salud, origen racial, afiliación sindical, orientación) con protección reforzada — Ley 172-13 exige consentimiento expreso y escrito
- [ ] Transferencia internacional de datos identificada y con base legal — si hay duda, escalo a legal
- [ ] Plazo de retención definido junto con D11

**No resuelvo la interpretación legal.** Documento el caso y lo marco como pregunta
abierta (`questions.md`) hacia el cliente o su asesoría legal cuando la base legal no es
evidente.

### 9. Plan de respuesta a incidentes (R2+)

- [ ] Canal y responsable de primera respuesta definidos
- [ ] Procedimiento de contención mínimo escrito
- [ ] Registro de qué se sabe, cuándo se supo, qué se hizo (línea de tiempo)
- [ ] Criterio de cuándo notificar (a quién, en qué plazo) si hay dato personal comprometido
- [ ] Handoff a D17 para la parte de observabilidad continua

### 10. Verificación con evidencia

Nada de lo anterior cierra sin prueba:

- [ ] Prueba que **intenta** cruzar un permiso y falla (no solo "el permiso existe")
- [ ] Cabecera de seguridad verificada en la respuesta real, no solo en la configuración
- [ ] Reporte de cada scanner adjunto, con fecha
- [ ] Ensayo de que un secreto rotado sigue funcionando sin downtime

---

## Herramientas y skills

| Situación | Skill / herramienta |
|---|---|
| Revisión de seguridad de código y configuración | `security-review` |
| Secretos en el repositorio e historial | Gitleaks (CLI) |
| Dependencias, imágenes, SBOM | Trivy (CLI) |
| Patrones de código vulnerable | CodeQL (CLI/GitHub Actions) |
| Superficie dinámica en ejecución | OWASP ZAP |
| Postgres/Supabase: RLS, roles, conexiones | `supabase`, `supabase-postgres-best-practices` |
| Verificación en navegador (cabeceras, cookies, CSP) | `browser-automation` |

**No hay skill instalada para orquestar CodeQL ni OWASP ZAP end-to-end todavía.** Se anota
en `known_limits` — se corren por CLI/CI directo hasta que exista una skill dedicada.

---

## Contrato de salida

- [ ] Inventario de puntos de entrada
- [ ] Modelo de amenazas STRIDE por entrada (`checklists/threat-model.md`)
- [ ] Línea base de aplicación aprobada (`checklists/security-baseline.md`)
- [ ] Hardening de infraestructura aprobado (`checklists/hardening.md`)
- [ ] Cero secretos en repositorio e historial
- [ ] SBOM y escaneo de dependencias sin críticos/altos abiertos sin mitigación
- [ ] Reportes de Gitleaks, Trivy, CodeQL y (si R2+) ZAP adjuntos
- [ ] Base legal documentada por cada dato personal
- [ ] Plan de respuesta a incidentes (si R2+)
- [ ] Hallazgos clasificados por severidad, cero P0 abiertos
- [ ] Handoff a D16 (infraestructura) y a humano (aprobación de producción)

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Validar permiso solo ocultando el botón en el cliente | Verificación en servidor, siempre, con prueba que intenta cruzarlo |
| `.env` con valores reales versionado | Gestor de secretos; `.env.example` solo con nombres |
| Secreto filtrado y solo eliminado del último commit | Rotación obligatoria; el historial ya lo expuso |
| Rate limiting en memoria del proceso | Almacén compartido (Redis o equivalente) si hay más de una instancia |
| Cabecera de seguridad "configurada" sin verificar en la respuesta real | Verificación con petición real, no solo lectura de configuración |
| CSP con `unsafe-inline` por comodidad | Nonce o hash; `unsafe-inline` es una excepción documentada, no la norma |
| RLS "debería estar bien" sin prueba de cruce | Prueba que intenta leer/escribir fuera del tenant y falla |
| Dependencia con vulnerabilidad conocida, sin plan | Mitigación o reemplazo con fecha, nunca "lo vemos después" |
| Modelo de amenazas sobre el sistema completo en abstracto | STRIDE por cada punto de entrada, uno a la vez |
| Aprobar producción sin aprobación humana registrada | Gate G6 exige acta; D12 nunca sustituye la firma humana |
| Base legal de un dato personal asumida, no escrita | Base legal explícita por dato, o pregunta abierta hacia el cliente |
| Auditoría de seguridad que solo lista hallazgos | Reconocer también los controles que ya funcionan bien, con evidencia |
