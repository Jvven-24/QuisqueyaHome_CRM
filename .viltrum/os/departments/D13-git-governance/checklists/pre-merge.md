# Checklist — antes de integrar a `main`

> Se aplica a **todo** cambio, sin excepción, por pequeño que sea. Trunk-based development
> no significa menos disciplina: significa que cada cambio individual tiene que sostenerla.
> Firma el revisor (D03 o el revisor de área asignado), nunca quien escribió el cambio.

## A. Tamaño y forma del cambio

- [ ] El commit (o la serie de commits) resuelve una sola unidad lógica
- [ ] El diff es revisable por una persona en minutos
- [ ] Ningún commit mezcla refactorización con funcionalidad nueva
- [ ] Si el cambio es grande, está dividido en una secuencia donde cada paso deja `main` desplegable
- [ ] La rama (si existe) tiene horas de vida, no días ni semanas

## B. Mensaje de commit

- [ ] Sigue la convención del repositorio (o Conventional Commits si no hay ninguna)
- [ ] El resumen dice qué cambió y para quién, no "fix" ni "cambios varios"
- [ ] `BREAKING CHANGE:` presente si rompe compatibilidad
- [ ] Referencia el issue, ticket o ADR relevante si existe

## C. Checks obligatorios — todos en verde, ninguno omitido

- [ ] **Lint** pasó
- [ ] **Tipos** (TypeScript/equivalente) pasó
- [ ] **Gitleaks** — sin secretos nuevos ni en el historial del cambio
- [ ] **Pruebas unitarias e integración** pasaron
- [ ] **Build** completó sin errores
- [ ] **E2E de recorridos críticos** pasó, si el cambio los toca
- [ ] Cada resultado queda enlazado como evidencia (no "corrí y pasó" sin enlace)

## D. Higiene del repositorio

- [ ] `.gitattributes` cubre el tipo de archivo que este cambio introduce, si es nuevo
- [ ] `.gitignore` actualizado si el cambio genera artefactos nuevos
- [ ] Sin archivo binario grande versionado sin necesidad
- [ ] Sin `.env`, credencial o clave incluida, ni en un archivo de ejemplo con valor real

## E. Trabajo incompleto

- [ ] Si la funcionalidad no está terminada, vive detrás de un feature flag apagado
- [ ] El flag tiene nombre, dueño y fecha estimada de retiro documentados
- [ ] Ninguna rama paralela está guardando trabajo a medio hacer en lugar de un flag

## F. Protección de `main`

- [ ] El cambio entra por PR, no por push directo
- [ ] La protección de rama exige los checks obligatorios como *required status checks*
- [ ] Al menos un revisor independiente aprobó — nunca la misma persona que produjo el cambio
- [ ] Force-push a `main` sigue deshabilitado

## G. Si el cambio es una reversión

- [ ] Usa `git revert`, nunca reescritura de historial
- [ ] Referencia el commit original y la razón de la reversión
- [ ] Si revierte una migración de datos, coordinado con D11 antes de ejecutar

---

## Veredicto

```
APROBADO      — todos los checks en verde, mensaje correcto, revisor independiente firmó
CONDICIONAL   — no existe para checks obligatorios. Un check en rojo nunca es condicional
RECHAZADO     — vuelve a quien produjo el cambio con hallazgos clasificados
```

Firma el revisor independiente, nunca quien escribió el commit.
