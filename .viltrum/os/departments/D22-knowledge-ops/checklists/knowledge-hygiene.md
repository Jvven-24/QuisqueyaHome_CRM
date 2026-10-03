# Checklist — higiene del conocimiento

> Se aplica en cada cierre de fase y en el mantenimiento periódico del vault y de
> `.viltrum/`. Firma el revisor (D00), nunca quien organizó el conocimiento.

## A. Taxonomía

- [ ] Todo documento nuevo está clasificado en una de las cinco carpetas
      (0-Inbox / 1-Daily / 2-Atomic / 3-Maps / 4-Archive)
- [ ] Nada permanece en `0-Inbox` más allá del ciclo de triage acordado
- [ ] Las notas atómicas contienen una sola idea, con título que la resume
- [ ] Los mapas de tema (`3-Maps`) enlazan notas atómicas reales, no las duplican

## B. Transcripciones y decisiones

- [ ] Toda transcripción cruda está archivada en `4-Archive`, con fecha y participantes
- [ ] Cada decisión relevante de esa transcripción está extraída por separado, con enlace
      a la fuente
- [ ] Ningún perfil está leyendo la transcripción cruda como fuente de trabajo diario

## C. Versionado

- [ ] Ningún documento de decisión fue sobrescrito sin dejar rastro de la versión anterior
- [ ] Cada versión relevante tiene fecha y autor
- [ ] Si hay dos copias del mismo documento, la fuente de verdad está marcada y la otra
      archivada

## D. `.viltrum/`

- [ ] Cada dato vive en un solo archivo — sin estado duplicado entre `status.md` y otros
- [ ] IDs (`Q-`, `CI-`, `CFG-`, `DEC-`) correlativos, sin renumeración ni reuso
- [ ] `config.md` no contiene ningún valor de secreto, solo qué falta y dónde debe vivir
- [ ] Las casillas se editaron individualmente; el archivo no fue reescrito completo sin
      necesidad

## E. Secretos y datos sensibles

- [ ] Ningún secreto (clave, token, contraseña) aparece en ningún documento versionado
- [ ] Si se encontró uno, fue escalado a D12 y removido — no simplemente movido de lugar
- [ ] Datos personales en transcripciones archivadas identificados para su tratamiento
      según la política de retención vigente

## F. Código indexado

- [ ] El repositorio del proyecto está indexado con `gitnexus` si el proyecto lo requiere
- [ ] Fecha del último índice registrada
- [ ] El índice se reconstruyó después de un cambio estructural significativo, no quedó
      desactualizado en silencio

---

## Veredicto

```
APROBADO      — checklist completa, sin secretos expuestos ni duplicados
CONDICIONAL   — excepciones con dueño y fecha. Nunca con un secreto expuesto
RECHAZADO     — vuelve a organización con hallazgos clasificados
```

Firma el revisor (D00), **nunca** quien organizó el conocimiento.
