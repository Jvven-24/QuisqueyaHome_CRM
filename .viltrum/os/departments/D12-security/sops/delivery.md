# D12 · Protocolo de entrega · Seguridad, privacidad y DevSecOps

Fase inicial: F2 · Revisor canónico: human · Versión: 1.1.0.
Las fases F0–F8 de core/lifecycle.md son diferentes de families del registro.
El protocolo concreta AGENTS/SOUL/manifest y conserva su autonomía; capabilities describe necesidades, no permisos ni herramientas instaladas.

## Entrada y profundidad

Lee AGENTS, SOUL y manifest de este departamento; clasifica por riesgo con D00. En F2 produce el modelo de amenazas que alimenta G2; en F4/F5 verifica controles implementados y en F6 revisa G6. No confundir la familia F4 con la fase del lifecycle. Inventaría HTTP, webhooks, colas, tareas, administración, importaciones, archivos, integraciones y, si existen, herramientas de IA; actor, formato, autenticación, destino y confianza por entrada. Una frontera desconocida es pregunta bloqueante, no superficie segura.

## Amenazas, permisos y privacidad

1. Traza entrada → validación → dominio → almacenamiento → salida y STRIDE por frontera. Define activo, atacante, precondición, impacto, control, responsable y prueba que demuestra el control.
2. Construye matriz actor/recurso/acción/tenant con denegación por defecto. Verifica autorización en servidor y almacenamiento, pertenencia de recursos, sesión expirada/revocada, privilegios administrativos, IDs alterados y acceso directo fuera de UI. El client-side es ayuda de UX; la restricción efectiva debe estar en servidor.
3. Prueba aislamiento con identidades de mínimo privilegio; una conexión superuser que ignora RLS no valida aislamiento. D14 ejecuta regresiones; D10/D11 corrigen los controles que poseen.
4. Por dato personal registra finalidad, necesidad, origen, destinatarios, retención, borrado y responsable. Separa dato personal de categoría legal sensible; no clasifiques cédulas automáticamente como categoría especial sin fuente jurídica. D01/D02/asesoría jurídica atribuyen las decisiones legales pendientes. Redacta evidencia y limita acceso; comprueba exportación, eliminación, backups y logs según política acordada.
5. Selecciona nivel ASVS por riesgo y referencia IDs con versión estable (p. ej. v5.0.0). Explica los controles no aplicables y conserva el motivo. Un score de scanner no demuestra cumplimiento ASVS.

## Verificación técnica

Examina autenticación, sesiones/cookies, CSRF cuando aplique, validación de entradas, inyección, salida segura, archivos, SSRF, secretos, criptografía del proveedor, rate limits distribuidos y auditoría. Verifica cabeceras/TLS en respuesta del proxy real. Revisa acceso de servicios y usuarios DB, exports, backups, contenedores y permisos del pipeline con D16. Ante IA, valida aislamiento de herramientas y datos con D18.

Inventaría herramientas disponibles y usa Gitleaks, Trivy/SBOM, CodeQL o ZAP según stack, licencia, superficie y autorización. Para cada ejecución registra herramienta/versión, reglas, commit, alcance, comando sin secretos, fecha, estado de salida y reporte. Un scanner ausente, un timeout o un job omitido se registra como no verificado. El escaneo dinámico se limita a targets autorizados en sandbox/staging; nunca se descubre un tercero como blanco de prueba. Los reportes no incluyen claves ni datos reales. Si se expuso un secreto, remite la rotación a su dueño.

## Salida, revisor y gates

Entrega amenazas, controles verificables, permisos, inventario de privacidad, reports y riesgos residuales. Cada hallazgo incluye severidad con justificación, ubicación, reproducción, dueño y condición de cierre. Un P0 bloquea; riesgos altos o excepciones legales no los acepta el propio perfil. Para G2/G5/G6 presenta evidencia a humano (revisor canónico), D00 y D16. D12 propone el resultado; la firma humana no se reemplaza por el reporte ni autoriza automáticamente producción.

**Handoff:** mandato, commit/entorno, entradas utilizadas, artefactos/evidencia redactada, checks realizados/fallidos/no ejecutados, hallazgos, preguntas, dueños y siguiente acción. Mantén la evidencia en el expediente de proyecto, no en el paquete del perfil.

## Herramientas, repositorios y límites

Consulta primero herramientas instaladas/accesos del proyecto. Una fuente oficial o skill registrada no concede conexión, credenciales, licencia ni instalación. GitNexus/Context7, si están disponibles, ayudan a localizar símbolos y documentación: corroborar contra commit y versión usada; no prueban comportamiento runtime. Mantén comandos de ejecución dentro del alcance del manifest/mandato y deja lo inaccesible como pendiente con dueño.

Los subagentes en delivery.json son tareas opcionales: activa solo si hay trabajo independiente, presupuesto y autorización de delegación. Reciben contrato, artefactos mínimos y herramientas necesarias; no heredan secretos ni privilegios de producción. Su salida no sustituye al revisor canónico. Reporta estado real (no ejecutado, bloqueado, verificado o pendiente de revisión) y no declarar certificación/100% de cobertura por haber escrito instrucciones.

Fuentes oficiales consultadas el 2026-09-29; seleccionar versión instalada antes de aplicar. No se copiaron repositorios ni se instalaron herramientas:

- [OWASP ASVS 5.0.0](https://owasp.org/projects/asvs)
- [Repositorio OWASP ASVS](https://github.com/OWASP/ASVS)
- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use)

