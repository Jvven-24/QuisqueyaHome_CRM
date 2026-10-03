# Checklist — completitud de documentación (Gate G6/pre-release)

> La firma es de D00, nunca de quien documentó.

## A. Clasificación Diátaxis

- [ ] Cada documento identificado como tutorial, guía práctica, referencia o explicación
- [ ] Ningún documento mezcla más de un cuadrante
- [ ] Existe al menos un documento de cada cuadrante para el proyecto (o se declara N/A con razón)

## B. README

- [ ] Qué es el proyecto, en una frase
- [ ] Cómo se instala, paso a paso, verificado por alguien que no lo escribió
- [ ] Cómo se corre localmente
- [ ] Cómo se ejecutan las pruebas
- [ ] Cómo se despliega (enlaza al runbook de D16, no lo duplica)
- [ ] Estructura del repositorio explicada
- [ ] A quién preguntar / dónde reportar un problema

## C. Manual de usuario

- [ ] Escrito para el rol de negocio, sin jerga técnica
- [ ] Cubre cada función visible para ese rol
- [ ] No incluye procedimientos de administración

## D. Manual de administración

- [ ] Gestión de usuarios y permisos
- [ ] Configuración del sistema
- [ ] Procedimiento de respaldo y restauración (enlazado a D16/D11, no duplicado)
- [ ] Rotación de secretos
- [ ] Escalamiento: a quién avisar y cómo, por severidad

## E. Arquitectura y decisiones

- [ ] Documento de arquitectura de D03 enlazado y vigente
- [ ] Índice de ADR navegable, con estado (vigente/superado) de cada uno
- [ ] Diagrama de dependencias actualizado a la versión actual del sistema

## F. Continuidad y restauración

- [ ] Procedimiento de restauración documentado de forma literal, sin contexto asumido
- [ ] Tiempos reales (medidos, no estimados) de restauración y reversión, citados
- [ ] Accesos y contactos necesarios, listados explícitamente

## G. Runbooks operativos

- [ ] Índice único con todos los runbooks de D16 y D17
- [ ] Cada alerta de D17 enlaza su runbook desde este índice
- [ ] Ningún runbook vive solo en la memoria de quien lo escribió

## H. Espacio `.viltrum/`

- [ ] `project.md`, `status.md`, `questions.md`, `decisions.md` al día
- [ ] Ningún dato de `.viltrum/` duplicado en otro documento aparte
- [ ] `questions.md` sin preguntas respondidas que sigan marcadas como abiertas

## I. Documentación viva

- [ ] Último cambio de arquitectura/esquema/runbook tiene su documento actualizado en el mismo PR
- [ ] Documentos superados marcados explícitamente, no borrados sin rastro

---

## Veredicto

```
APROBADO      — checklist completa, verificacion del criterio junior superada
CONDICIONAL   — excepciones con dueño y fecha. Nunca sin procedimiento de restauración
RECHAZADO     — vuelve a D20 con hallazgos clasificados
```

**Recordatorio:** documentación que nadie puede seguir sin preguntar no es
documentación — es una nota para quien ya sabía.

Firma del revisor (D00): _______________________  Fecha: _______________
