---
id: Ixx
sistema:            # p. ej. Twenty, Moodle
repo:               # URL GitHub
licencia:           # spdx verificado en la API + detalle si NOASSERTION
modo: RUN           # RUN | APP | PORT | REFERENCE (ARQ-VRE-002)
puerto:             # CrmPort, AprendizajePort...
estado: DRAFT
riesgo: R2
owner: D19
revisores: [D12, D14]
actualizado: 2026-10-04
---

# <Ixx> · <Sistema>

## 1. Para qué lo usamos y para qué no
## 2. Fuente de verdad (qué entidades posee él y cuáles nosotros)
## 3. Contrato del puerto (métodos, tipos del dominio, errores)
## 4. Mapeo de datos (campo nuestro ↔ campo suyo) y enlace por `external_refs`
## 5. Eventos: salientes (outbox) y entrantes (webhook verificado → caso de uso)
## 6. Catálogo de fallos (timeout, 401, 403, 404, 409, 429, 5xx, payload inválido, duplicado, fuera de orden, caída)
## 7. Despliegue (local Docker / VPS, recursos, secretos en env.ts, versión fijada)
## 8. Pantallas nuestras que lo representan (referencia a fichas M/G)
## 9. Pruebas de contrato y criterios de aceptación
## 10. Riesgos, licencia y plan de salida (cómo sustituirlo)
