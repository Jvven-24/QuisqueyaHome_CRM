# D16 · Protocolo de entrega · DevOps, despliegue y release

Fase inicial: F6 · Revisor canónico: D12 · Versión: 1.1.0.
Las fases F0–F8 de core/lifecycle.md son diferentes de families del registro.
El protocolo concreta AGENTS/SOUL/manifest y conserva su autonomía; capabilities describe necesidades, no permisos ni herramientas instaladas.

## Preparar el release

Lee G5 del expediente y evidencia del build, no solo un status verde escrito. Bloquea promoción si es otra versión o quedan P0. D12 es revisor canónico; aprobación técnica y aprobación humana de producción son registros distintos. Antes de C1 aceptado se permite planificar ambientes/despliegue para propuesta; el trabajo de producto y provisionado siguen lifecycle.

Define dev/staging/prod, propietario, recursos, runtime, red, datos sintéticos/anonimizados y paridad. Conserva infraestructura como código disponible en el stack y explica divergencias; no forzar Compose para plataformas con runtime diferente. Identifica dependencia/proveedor evaluado por D21/D03, sin crear servicios ni contratar por existencia de una fuente.

## Pipeline y artefactos

Build reproducible con lockfiles/versiones; etiqueta inmutable por SHA y digest verificable, SBOM/scans y pruebas. Promueve el artefacto que pasó staging, evitando reconstrucción distinta para producción; documenta configuración por ambiente sin secretos. Asegura permisos mínimos por job, acciones de terceros por SHA completo y procedencia comprobada, inputs no confiables fuera de shell interpolado, aislamiento de runners y ausencia de secretos en PRs externos. Considera OIDC acotado al entorno/repo/ref si el proveedor lo permite y fue aprobado; no modificar identidad ni obtener tokens por iniciativa.

GitHub environments puede ofrecer revisores según plan/visibilidad; confirma disponibilidad antes de prometer enforcement. Si no está disponible, documenta control alternativo real que exige aprobación y acceso restringido. Un archivo de acta no protege por sí solo el pipeline.

## Migración y continuidad

1. D11 entrega migración versionada ensayada sobre copia autorizada/anonimizada representativa, compatibilidad y volumen/timing. La copia no se almacena en el repositorio.
2. Separa expand/migrate/verify/contract cuando haya cambios incompatibles. Antes de contract verifica lectores antiguos, jobs y consumidores y la ventana de rollback; no eliminar columna mientras la versión anterior la necesita.
3. Define RPO/RTO con negocio y mecanismos de respaldo acordes. Ensaya restauración real aislada: valida checksum cuando aplique, schema, filas críticas, relaciones, permisos y recorrido de negocio. Registra tiempo y punto recuperado; que el backup exista o el dump termine no prueba recovery.
4. Prepara rollback de aplicación, configuración y datos por separado: digest previo, permisos, comandos, observabilidad, gatillo, dueño y tiempo ensayado. Un down migration que borra datos no es una reversión segura; exige restore/forward fix diseñado por D11 y autorización.
5. Documenta punto de no retorno y pérdida de datos posible. Ni restauración de copia ni rollback de código preservan automáticamente escrituras posteriores; especifica conciliación y RPO.
6. Verifica salud/readiness, TLS/DNS, recursos, secretos por ambiente, límites y observabilidad antes de tráfico. Ensaya corte progresivo/blue-green/estrategia acordada; si la plataforma exige downtime, registra ventana y aprobación de negocio explícita.

## Aprobación y publicación

Deja runbooks concretos con precondiciones, comandos sin secretos, verificación por paso, aborto, fallback y contactos. G6 requiere evidencia de backup restore, rollback, migración, alertas y documentación. La aprobación humana referencia aprobador, fecha, ambiente, commit/digest, alcance/cambios de esquema, ventana y acciones autorizadas. Si cambia el artefacto o migración, revalida y renueva aprobación aplicable.

Dentro del mandato autorizado, ejecuta en dev/staging. Para producción exige aprobación G6 antes de mutar; el perfil no se autoaprueba. Si el pipeline no impone el control y no hay autorización explícita, entrega preparado. Hotfix/incidente conserva trazabilidad y autorización; D17 no concede privilegios por la urgencia.

Tras promoción autorizada verifica versión efectiva, health y recorrido clave; aplica criterios de rollback previamente autorizados o solicita humano si exceden mandato. Documenta resultado real, no solo job deployment exitoso.

**Handoff a D17/D20:** release/digest, config y migración, alertas/SLO, ventana de observación, runbooks, responsables, aprobación, tiempos de recovery y riesgos abiertos. Credenciales se transfieren mediante el mecanismo seguro aprobado; el handoff solo registra dueño y referencia.

## Herramientas, repositorios y límites

Consulta primero herramientas instaladas/accesos del proyecto. Una fuente oficial o skill registrada no concede conexión, credenciales, licencia ni instalación. `viltrum repo-*` (mapa de repositorio) y Context7, si está disponible, ayudan a localizar símbolos y documentación: corroborar contra commit y versión usada; no prueban comportamiento runtime. Mantén comandos de ejecución dentro del alcance del manifest/mandato y deja lo inaccesible como pendiente con dueño.

Los subagentes en delivery.json son tareas opcionales: activa solo si hay trabajo independiente, presupuesto y autorización de delegación. Reciben contrato, artefactos mínimos y herramientas necesarias; no heredan secretos ni privilegios de producción. Su salida no sustituye al revisor canónico. Reporta estado real (no ejecutado, bloqueado, verificado o pendiente de revisión) y no declarar certificación/100% de cobertura por haber escrito instrucciones.

Fuentes oficiales consultadas el 2026-09-29; seleccionar versión instalada antes de aplicar. No se copiaron repositorios ni se instalaron herramientas:

- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)

