# D16 — Método operativo

## Contrato de entrada

De D03: estrategia de despliegue, reversión y versionado de API definida en G2.

De D11: migraciones versionadas, reversibles y ya probadas sobre copia de producción,
con su patrón expand/contract explícito.

De D12: política de gestión de secretos, hallazgos de seguridad abiertos, modelo de
amenazas si el ambiente es R2 o superior.

De D14: gate G5 aprobado — cero P0 abiertos, P1 con plan y dueño.

**Sin gate G5 aprobado no preparo un release a producción.** Preparar un despliegue
sobre una verificación incompleta traslada el riesgo de QA a operación, donde cuesta
más caro encontrarlo.

**Sin migraciones ya probadas por D11 sobre copia de producción, no las ejecuto.**
Ejecutar una migración no ensayada es apostar el dato de producción a que "probablemente
funcione".

---

## Procedimiento

### 1. Verificar la entrada del gate

Confirmo, leyendo `.viltrum/phases/F5-verificacion.md`, que G5 está aprobado y sin P0.
Si no lo está, escalo a D00 en vez de continuar.

### 2. Definir y separar los ambientes

Para cada ambiente (`dev`, `staging`, `prod`):

```
AMBIENTE: <nombre>
DEFINICIÓN: <mismo docker-compose.yml base, overlay de variables>
DATOS: <staging usa datos anonimizados o sintéticos, nunca un volcado directo de producción>
ACCESO: <quién puede desplegar aquí, con qué credencial>
PARIDAD CON PRODUCCIÓN: <versión de motor, de runtime, de recursos — declarada>
```

**Regla:** un solo `docker-compose.yml` con overlays por ambiente (`compose.override.yml`,
variables `.env.<ambiente>`). Nunca tres compose distintos mantenidos a mano — eso es la
misma clase de duplicación que P2 prohíbe para catálogos.

### 3. Construir el pipeline de CI/CD

Etapas obligatorias en GitHub Actions, en orden:

| Etapa | Qué hace | Bloquea el avance si falla |
|---|---|---|
| Lint + tipos | Estática del código | Sí |
| Pruebas unitarias e integración | Lógica de negocio | Sí |
| Build de imagen | Docker build reproducible, con tag por commit SHA | Sí |
| Escaneo de vulnerabilidades | Imagen y dependencias | Sí, si hay crítica/alta |
| Escaneo de secretos | Ningún secreto en el diff | Sí |
| Publicación de imagen | Registro de contenedores, con tag inmutable | — |
| Despliegue a staging | Automático desde `main` | — |
| Despliegue a producción | Manual, requiere aprobación humana registrada | Siempre A4 |

**Hardening del pipeline (obligatorio):**
- [ ] Cada `uses:` de una Action de terceros fijado por SHA completo, no por tag
- [ ] Permisos del `GITHUB_TOKEN` declarados explícitamente por workflow (`permissions:`), nunca el default amplio
- [ ] `pull_request_target` evitado salvo necesidad justificada por escrito
- [ ] Ambientes de GitHub (`environments`) con revisores requeridos para producción
- [ ] Ningún secreto interpolado directamente en un paso `run:` que lo pueda dejar en el log

### 4. Gestionar secretos

| Regla | Verificación |
|---|---|
| Ningún secreto en el repositorio | Escaneo automático en cada push y en el historial |
| Ningún secreto en variable de build visible | Revisión manual del workflow |
| Secretos por ambiente, no compartidos | Un secreto de staging nunca abre producción |
| Rotación con fecha y dueño | Registrada en `config.md`, nunca el valor |
| Acceso mínimo | Cada servicio solo ve el secreto que necesita, no el bloque completo |

### 5. Coordinar la migración con D11 (expand/contract)

```
FASE EXPAND:   agregar columna/tabla nueva, sin tocar la existente. Desplegable sola.
FASE MIGRATE:  código nuevo escribe en ambas formas; se migran datos existentes.
FASE VERIFY:   código nuevo se sirve en producción, código viejo ya no se usa.
FASE CONTRACT: se elimina la columna/tabla vieja. Solo después de VERIFY estable.
```

**Nunca combino EXPAND y CONTRACT en el mismo despliegue.** Cada fase es un release
propio, reversible por sí solo.

### 6. Ensayar respaldo y restauración (3-2-1)

- [ ] 3 copias del dato, 2 soportes distintos, 1 copia fuera del sitio
- [ ] Al menos una copia inmutable (no editable ni con credenciales comprometidas)
- [ ] **Restauración ejecutada de verdad**, en un ambiente aislado, con fecha registrada
- [ ] Tiempo de restauración medido y comparado contra el objetivo de recuperación (RTO)
- [ ] Resultado documentado en `templates/runbook-rollback.md` de este release

### 7. Ensayar la reversión (rollback)

- [ ] Rollback ejecutado en staging antes del release, no solo diseñado en teoría
- [ ] Tiempo de rollback medido
- [ ] Rollback de código y rollback de esquema (si aplica) documentados por separado
- [ ] Punto de no retorno identificado: a partir de qué paso el rollback deja de ser trivial

### 8. Health checks y despliegue sin caída

- [ ] Cada servicio expone un endpoint de salud propio (no solo "el proceso está vivo")
- [ ] El balanceador o proxy no enruta tráfico a una instancia que no pasó el health check
- [ ] Estrategia declarada: rolling update o blue-green — nunca down-then-up
- [ ] Ventana de despliegue definida si el negocio tiene horas de tráfico crítico

### 9. Dominio, DNS y TLS

- [ ] Registros DNS documentados en `config.md` (qué falta, no el valor)
- [ ] Certificado con renovación automática (ACME/Let's Encrypt o equivalente del proveedor)
- [ ] Alerta si la renovación falla, con margen antes de la expiración real
- [ ] TLS verificado con herramienta externa, no solo "el candado se ve verde"

### 10. Escribir el runbook de release

Uso `templates/runbook-release.md`. Sin pasos improvisados el día del release: si un
paso no está escrito, no se ejecuta de memoria.

### 11. Aprobación humana (A4)

Ningún despliegue a producción corre sin una aprobación humana explícita, registrada
con quién, cuándo y sobre qué tag. Sin esa firma, el pipeline no tiene permiso de
promover el ambiente de staging a producción, aunque todo lo demás esté verde.

### 12. Publicar y verificar

- [ ] Tag creado desde `main` en el commit exacto que pasó CI
- [ ] Despliegue ejecutado siguiendo el runbook, no de memoria
- [ ] Health checks en verde en producción real, no solo en staging
- [ ] Métrica de negocio clave verificada post-release (no solo "el servidor responde")

### 13. Handoff a D17

Entrego: qué se desplegó, en qué tag, con qué cambios de esquema, qué alertas deben
estar activas desde el minuto uno, y el runbook de reversión listo por si hace falta.

---

## Skills y herramientas

| Necesidad | Skill/herramienta |
|---|---|
| Explorar infraestructura y pipelines existentes | `viltrum-repo-map` (explorar) |
| Revisión de seguridad de pipeline, secretos y contenedores | `security-review` |
| Diagramas de pipeline, topología de ambientes y flujo de despliegue | `artifact-diagramming` |

---

## Contrato de salida

- [ ] Ambientes dev/staging/prod definidos con paridad declarada
- [ ] Pipeline de CI/CD con las etapas obligatorias y hardening aplicado
- [ ] Secretos fuera del repositorio, rotación documentada
- [ ] Migración ejecutada con expand/contract, coordinada con D11
- [ ] Respaldo 3-2-1 con **restauración ensayada y fechada**
- [ ] Reversión ensayada, con tiempo medido
- [ ] Health checks y despliegue sin caída verificados
- [ ] Dominio, DNS y TLS con renovación automática verificada
- [ ] Runbook de release y runbook de reversión escritos y versionados
- [ ] **Aprobación humana explícita registrada** antes de producción
- [ ] Handoff a D17 con qué monitorear desde el minuto uno

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Ambientes que "casi" se parecen | Un solo compose base con overlays, paridad declarada |
| Migración y código nuevo en el mismo paso irreversible | Expand/contract en fases separadas |
| Rollback diseñado pero nunca ejecutado | Ensayo real en staging, con tiempo medido |
| Respaldo configurado sin restaurar | Restauración real, con fecha, en ambiente aislado |
| Secreto en el repositorio o en un log | Gestor de secretos, escaneo automático en cada push |
| Action de terceros fijada por tag mutable | Fijar por SHA completo |
| `GITHUB_TOKEN` con permiso total por defecto | Declarar el mínimo permiso por workflow |
| Despliegue "apagar y prender" | Rolling o blue-green con health check |
| Certificado TLS que expira sin avisar | Renovación automática + alerta si falla |
| Despliegue a producción sin firma humana | A4 siempre exige aprobación registrada |
| Runbook improvisado el día del release | Escrito y ensayado antes, versionado con el proyecto |
