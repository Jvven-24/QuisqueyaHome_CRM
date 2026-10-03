# Checklist — preparación de release (Gate G6)

> La firma es de D12, nunca de quien preparó el release.

## A. Ambientes

- [ ] `dev`, `staging` y `prod` definidos desde el mismo `docker-compose.yml` base
- [ ] Diferencias entre ambientes limitadas a variables de entorno y recursos
- [ ] Staging usa datos anonimizados o sintéticos, nunca un volcado directo de producción
- [ ] Versión de motor de base de datos y runtime igual en staging y producción
- [ ] Acceso a cada ambiente documentado: quién puede desplegar, con qué credencial

## B. Pipeline de CI/CD

- [ ] Lint y tipos bloquean el avance si fallan
- [ ] Pruebas unitarias e integración bloquean el avance si fallan
- [ ] Build de imagen reproducible, tag por commit SHA
- [ ] Escaneo de vulnerabilidades de imagen y dependencias, bloqueante en crítico/alto
- [ ] Escaneo de secretos en cada push, incluido el historial del diff
- [ ] Despliegue a producción manual, con ambiente de GitHub y revisores requeridos

## C. Hardening del pipeline

- [ ] Toda Action de terceros fijada por SHA completo, no por tag mutable
- [ ] `permissions:` declarado explícitamente por workflow, nunca el default amplio
- [ ] `pull_request_target` evitado o justificado por escrito
- [ ] Ningún secreto interpolado en un paso `run:` que pueda quedar en el log
- [ ] Acciones provienen de creadores verificados o de confianza declarada

## D. Secretos

- [ ] Ningún secreto en el repositorio, ni en el historial de git
- [ ] Secretos separados por ambiente — uno de staging nunca abre producción
- [ ] Rotación con fecha y dueño registrados en `config.md` (nunca el valor)
- [ ] Cada servicio accede solo al secreto que necesita

## E. Migraciones (coordinado con D11)

- [ ] Migración probada sobre copia de producción, no sobre base vacía
- [ ] Patrón expand/contract aplicado — nunca expand y contract en el mismo despliegue
- [ ] Código nuevo compatible con el esquema viejo durante la fase de transición
- [ ] Tiempo de ejecución medido sobre volumen real

## F. Respaldo

- [ ] 3 copias, 2 soportes distintos, 1 copia fuera del sitio
- [ ] Al menos una copia inmutable
- [ ] **Restauración ensayada de verdad, con fecha del último ensayo**
- [ ] Tiempo de restauración medido contra el objetivo de recuperación

## G. Reversión

- [ ] Rollback ejecutado en staging antes del release, no solo diseñado
- [ ] Tiempo de rollback medido
- [ ] Rollback de código y de esquema documentados por separado
- [ ] Punto de no retorno identificado y comunicado

## H. Despliegue sin caída

- [ ] Cada servicio expone su propio health check
- [ ] El proxy o balanceador no enruta a una instancia que no pasó el health check
- [ ] Estrategia rolling o blue-green declarada — nunca down-then-up
- [ ] Ventana de despliegue definida si hay horas de tráfico crítico

## I. Dominio, DNS y TLS

- [ ] Registros DNS documentados en `config.md`
- [ ] Certificado con renovación automática configurada
- [ ] Alerta activa si la renovación automática falla
- [ ] TLS verificado con herramienta externa antes del release

## J. Documentación y aprobación

- [ ] Runbook de release escrito y versionado con el proyecto
- [ ] Runbook de reversión escrito y versionado con el proyecto
- [ ] Observabilidad activa antes de publicar (handoff a D17 confirmado)
- [ ] **Aprobación humana explícita registrada**, con quién, cuándo y sobre qué tag

---

## Veredicto

```
APROBADO      — checklist completa, aprobación humana registrada
CONDICIONAL   — excepciones con dueño y fecha. Nunca con P0 ni sin restauración ensayada
RECHAZADO     — vuelve a D16 con hallazgos clasificados
```

**Recordatorio:** un rollback nunca ensayado y un respaldo nunca restaurado son la misma
clase de mentira — una capacidad que se supone, no que se demostró.

Firma del revisor (D12): _______________________  Fecha: _______________
