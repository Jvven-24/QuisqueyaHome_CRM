# Checklist — ensayo de respaldo, restauración y reversión

> Un respaldo que nunca se restauró es una esperanza, no una garantía. La firma es de
> D12, nunca de quien ejecutó el ensayo.

## A. Preparación del ensayo

- [ ] Ambiente de ensayo aislado de producción (no comparte red ni credenciales)
- [ ] Fecha del ensayo fijada de antemano, no "cuando haya tiempo"
- [ ] Alcance declarado: qué se restaura (base completa, esquema, un solo tenant)
- [ ] Datos de producción reales solo si están anonimizados o el ensayo corre en un
      entorno con el mismo control de acceso que producción

## B. Regla 3-2-1(-1-0)

- [ ] 3 copias del dato existen en este momento
- [ ] 2 soportes de almacenamiento distintos verificados
- [ ] 1 copia fuera del sitio (otra región, otro proveedor)
- [ ] 1 copia inmutable, que ni un atacante con credenciales comprometidas puede alterar
- [ ] 0 errores: el último ensayo de restauración no reportó ninguno

## C. Ejecución de la restauración

- [ ] Restauración ejecutada de principio a fin, sin pasos saltados "porque ya se sabe"
- [ ] Hora de inicio y hora de fin registradas
- [ ] Tiempo de restauración (RTO real) comparado contra el objetivo declarado
- [ ] Punto de recuperación (RPO real) verificado: cuánto dato se habría perdido
- [ ] Integridad de los datos restaurados verificada con una consulta de control, no solo
      "el proceso terminó sin error"

## D. Cifrado y acceso

- [ ] Respaldos cifrados en reposo
- [ ] Acceso a los respaldos restringido a roles explícitos
- [ ] Acceso a los respaldos auditado — queda registro de quién descargó o restauró

## E. Ensayo de reversión de despliegue

- [ ] Rollback de código ejecutado en staging: versión anterior queda sirviendo tráfico
- [ ] Rollback de esquema ejecutado si la migración lo requiere, siguiendo expand/contract
- [ ] Tiempo total de rollback medido
- [ ] Verificado que el rollback no deja el sistema en un estado intermedio inconsistente
- [ ] Punto de no retorno documentado: desde qué paso el rollback deja de ser trivial

## F. Resultado y aprendizaje

- [ ] Diferencia entre lo esperado y lo ocurrido documentada, aunque el ensayo haya salido bien
- [ ] Todo hallazgo del ensayo clasificado por severidad (P0–P3)
- [ ] Fecha del próximo ensayo programada, no indefinida
- [ ] Resultado escrito en `templates/runbook-rollback.md` del proyecto

---

## Veredicto

```
APROBADO      — restauración y reversión ejecutadas, medidas y dentro de objetivo
CONDICIONAL   — ensayo con hallazgos menores, plan y fecha de corrección
RECHAZADO     — restauración o reversión fallida, no ensayada, o sin evidencia verificable
```

**Recordatorio:** "el respaldo está configurado" no es evidencia. Evidencia es la fecha
del ensayo, el tiempo medido y la integridad verificada.

Firma del revisor (D12): _______________________  Fecha: _______________
