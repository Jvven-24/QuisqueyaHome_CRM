# D13 · Protocolo de entrega · Git, GitHub y gobierno del código

Fase inicial: F4 · Revisor canónico: D03 · Versión: 1.1.0.
Las fases F0–F8 de core/lifecycle.md son diferentes de families del registro.
El protocolo concreta AGENTS/SOUL/manifest y conserva su autonomía; capabilities describe necesidades, no permisos ni herramientas instaladas.

## Contexto del cambio

Inspecciona git status, rama, remotos e instrucciones del repositorio. Conserva cambios humanos; no uses reset/clean para organizar el expediente. Lee manifest y política existente: aplica la convención del proyecto y trunk-based de Viltrum donde sea su política vigente. Para repositorios adoptados registra divergencias y propuesta a D03 sin reestructurar ramas unilateralmente. El prefijo local de ramas acordado no implica permiso de push.

Vincula mandato/requisito → ADR/contrato → diff → commit → PR → build → artefacto. Divide por responsabilidad/reversibilidad, sin dividir cambios de forma que cada entrega quede rota. Si hay flags, incluye dueño, estado seguro por defecto y fecha de retiro.

## CI y revisión

1. Deriva checks del stack y riesgo: lint/tipos/build donde existan, secretos, lógica/integración y E2E si cambia un recorrido crítico. Para documentación de bajo impacto no inventes un build de producto; documenta aplicabilidad.
2. Para cada check registra nombre único requerido, SHA probado, estado terminal, link al run y alcance. Un run verde de un SHA anterior, un job skipped o un exit code ocultado con continue-on-error no acredita el cambio actual. Si cambia el diff, renueva evidencia relevante.
3. Revisa workflows como código ejecutable: SHA completo para acciones de terceros, token de lectura por defecto y mínimos permisos por job, entradas no confiables fuera de interpolación de scripts y separación de PRs externos de secretos/cloud. La publicación usa job/credencial separados. D12 revisa riesgos de supply chain.
4. Revisa protección de main/rulesets y CODEOWNERS en lectura. Si faltan, prepara configuración propuesta y registra limitaciones de plan/proveedor; cambiar reglas remotas necesita alcance autorizado y acceso. No marques configurado aquello que solo escribiste como propuesta.
5. El dueño técnico verifica el cambio funcional; D03 revisa el trabajo de D13. No generar aprobación de bot presentada como humana ni usar una misma identidad como autor/revisor. Hallazgo corregido vuelve al revisor independiente.
6. Respeta la estrategia de merge aprobada y checks requeridos. No integra mientras alguno esté pendiente/rojo; si no existe autorización para merge, entrega PR revisable o diff con estado pendiente.

## Versionado y reversión

Identifica API/SDK/esquema públicos y cambios incompatibles; coordina SemVer, notas de migración y changelog con D03/D20. La etiqueta/release apunta al commit con evidencias actuales; el artefacto desplegado se identifica además por digest. Crear un tag local y publicar un release remoto son acciones distintas y se registran por separado.

Prepara git revert y su regresión; un rollback operativo puede promover un artefacto previo verificado con D16 sin esperar a que el revert reconstruya la imagen. El revert de código no restaura automáticamente datos ni compatibilidad DB; D11/D16 coordinan esos planos. Nunca reescribir historial publicado como mecanismo de rollback.

## Entrega y aceptación

Entrega paquete PR/diff, trazabilidad, checks del SHA, revisores, pendientes de acceso, versión/compatibilidad y plan de reversión a D03. D14 recibe cobertura de regresión y D16 los artefactos a promover. D00 custodia G4; el informe de D13 no concede producción, que requiere G6 y humano.

**Handoff:** mandato, SHA base/final, autor/revisor, archivos afectados, evidencia del CI, hallazgos abiertos, acciones remotas realizadas o pendientes y receptor. No imprimir tokens ni introducir credenciales en documentación.

## Herramientas, repositorios y límites

Consulta primero herramientas instaladas/accesos del proyecto. Una fuente oficial o skill registrada no concede conexión, credenciales, licencia ni instalación. `viltrum repo-*` (mapa de repositorio) y Context7, si está disponible, ayudan a localizar símbolos y documentación: corroborar contra commit y versión usada; no prueban comportamiento runtime. Mantén comandos de ejecución dentro del alcance del manifest/mandato y deja lo inaccesible como pendiente con dueño.

Los subagentes en delivery.json son tareas opcionales: activa solo si hay trabajo independiente, presupuesto y autorización de delegación. Reciben contrato, artefactos mínimos y herramientas necesarias; no heredan secretos ni privilegios de producción. Su salida no sustituye al revisor canónico. Reporta estado real (no ejecutado, bloqueado, verificado o pendiente de revisión) y no declarar certificación/100% de cobertura por haber escrito instrucciones.

Fuentes oficiales consultadas el 2026-09-29; seleccionar versión instalada antes de aplicar. No se copiaron repositorios ni se instalaron herramientas:

- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use)
- [GitHub environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)

