# D20 · Protocolo de entrega · Documentación, formación y mantenimiento

Fase inicial: F6 · Revisor canónico: D00 · Versión: 1.1.0.
Las fases F0–F8 de core/lifecycle.md son diferentes de families del registro.
El protocolo concreta AGENTS/SOUL/manifest y conserva su autonomía; capabilities describe necesidades, no permisos ni herramientas instaladas.

## Documentación desde las fuentes

Recibe commit/build y artefactos fuente de D03/D11/D16/D17; registra versión, dueño y fecha. Si el dato no está decidido, abre pregunta y no documentes la hipótesis como sistema actual. Valida comportamiento y comandos contra fuentes del repositorio, carga contexto por sección y respeta acceso mínimo; un documento cliente no necesita logs privados.

Clasifica el contenido con Diátaxis (aprender, ejecutar una tarea, consultar referencia, entender decisiones). El README sirve de entrada navegable con propósito y pasos breves, enlaces hacia documentos especializados; no exige fragmentar artificialmente documentos de una página. Mantén una fuente por dato: índice enlaza runbooks/ADRs originales, no copia pasos que divergirán.

## Entregables por audiencia

1. README: prerrequisitos y versiones soportadas, instalación/arranque con comandos verificados, variables por nombre/finalidad sin valores secretos, health check esperado, pruebas, build, enlace al release, estructura y soporte/licencia aplicable.
2. Manual usuario: flujos/roles, validaciones, recuperación de errores, seis estados de UI donde correspondan y canal de ayuda. No revelar permisos/acciones administrativas a audiencias sin acceso.
3. Manual administración: tareas autorizadas, permisos necesarios, ambiente/destino, accesos por referencias a gestor seguro, respaldo/restauración, rollback, usuarios y escalamiento; comandos exactos obtenidos de los runbooks aprobados.
4. Referencia: contrato API/eventos/config y diccionario de datos enlazados a versión; esquema, error y compatibilidad. Arquitectura/ADR: estado vigente/superado y responsables, sin decisiones inventadas.
5. Índice único de runbooks incluye release, rollback, restore, rotación de secretos, incidentes y cada alerta; verifica que destinos existen y son visibles solo por la audiencia correcta.
6. Explica mantenimiento: owner por documento, cambios que obligan a actualizarlo en el mismo PR, revisión de obsolescencia y compatibilidad de versiones anteriores.

## Verificación operable

Cada procedimiento crítico contiene precondiciones, target/ambiente inequívoco, pasos/resultado esperado, falla posible y qué hacer, stop conditions, escalamiento y permisos. D11/D16 poseen los comandos reales de restore y D16 de rollback; D20 no los inventa ni ejecuta producción para verificar el texto.

La persona/agente fresh-reader recibe documentación y sandbox autorizado, sin explicación oral. Puede leer y detectar ambigüedad; ejecutar comandos se limita a herramientas/accesos disponibles y alcance de ensayo. Registra qué pudo ejecutar, evidencia, tiempo y bloqueos. Una revisión documental no se presenta como restore ensayado ni sustituye la evidencia de D16. El criterio junior no autoriza acciones de producción; el runbook exige G6/mandato humano antes de mutar.

Valida que referencias del expediente, status, questions y decisions citan fuentes actuales y no duplican decisiones; corrige documentos de su ámbito y remite inconsistencias de otros dueños. Capturas/demos usan datos sintéticos; no convertir artefacto ficticio en aceptación de cliente.

## Entrega, aprobación y mantenimiento

Paquete de handoff: versión/alcance entregado, documentos/enlaces por audiencia, funciones/roles, accesos formalizados por responsable vía canal seguro, limitaciones/pendientes, garantías/soporte acordados, capacitación y evidencia de recepción. Una llamada propuesta es pendiente, no capacitación realizada; fecha/asistentes/recibo se atribuyen a fuentes reales.

D00 revisa completitud y cobertura documental para F6/G6. La entrega de manuales no cierra G6 sin backup/restore y aprobación humana. Tras incidente o cambio de contrato, vincula actualización al PR y conocimiento D22.

**Handoff:** índice/versiones, fuentes de comandos/arquitectura, ensayos/reportes y límites, pendientes con dueño, confirmación de recepción cuando exista y plan de mantenimiento. Nunca incluir credenciales, tokens ni datasets personales.

## Herramientas, repositorios y límites

Consulta primero herramientas instaladas/accesos del proyecto. Una fuente oficial o skill registrada no concede conexión, credenciales, licencia ni instalación. `viltrum repo-*` (mapa de repositorio) y Context7, si está disponible, ayudan a localizar símbolos y documentación: corroborar contra commit y versión usada; no prueban comportamiento runtime. Mantén comandos de ejecución dentro del alcance del manifest/mandato y deja lo inaccesible como pendiente con dueño.

Los subagentes en delivery.json son tareas opcionales: activa solo si hay trabajo independiente, presupuesto y autorización de delegación. Reciben contrato, artefactos mínimos y herramientas necesarias; no heredan secretos ni privilegios de producción. Su salida no sustituye al revisor canónico. Reporta estado real (no ejecutado, bloqueado, verificado o pendiente de revisión) y no declarar certificación/100% de cobertura por haber escrito instrucciones.

Fuentes oficiales consultadas el 2026-09-29; seleccionar versión instalada antes de aplicar. No se copiaron repositorios ni se instalaron herramientas:

- [Diátaxis](https://diataxis.fr/)
- [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
- [GitHub deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)

