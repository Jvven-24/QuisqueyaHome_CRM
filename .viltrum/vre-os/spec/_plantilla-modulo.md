---
id: Mxx            # o Gxx para globales
nombre:
estado: DRAFT      # DRAFT | REVIEW | READY | BUILT | VERIFIED
riesgo: R2         # por dato/acción, BP §5.3
owner: D10         # productor principal al construir
revisores: [D14]
fuente_de_verdad: PostgreSQL local   # o el sistema externo, según ARQ-VRE-002 §2.4
depende_de: []
actualizado: 2026-10-04
---

# <Mxx> · <Nombre>

## 1. Propósito y usuarios
Problema que resuelve, roles que lo usan (admin, broker, asistente, cliente) y su trabajo principal (JTBD).

## 2. Estado actual (AS-IS, del inventario P0)
Rutas, casos de uso, tablas y pruebas que ya existen (archivo:línea). Qué está incompleto o es boceto.

## 3. Pantallas
Una subsección por pantalla:
- **Ruta** y **tabs** (qué contiene cada tab).
- **Contenido** (bloques, tablas, gráficas con la consulta que las alimenta).
- **Acciones** (botones, atajos) y quién puede ejecutarlas.
- **Móvil 320/390**: lista de tarjetas, hoja inferior, acciones del dock.
- **Seis estados**: carga · vacío · error · sin conexión · éxito · permiso insuficiente (+ conflicto/expirado si aplica).
- **Componentes** (Viltrum Design por id, shadcn) y wireframe 390/1440 (de P3).

## 4. Funciones (casos de uso)
Tabla: nombre · entrada (Zod) · reglas de negocio · salida · errores · permiso (`recurso:acción:alcance`) ·
evento que emite (outbox) · idempotencia.

## 5. Datos
Entidades y campos (tabla existente o nueva), catálogos en tabla, restricciones (CHECK/UNIQUE/FK), RLS, auditoría.

## 6. Integraciones y puertos
Puertos que usa (`CrmPort`, `MensajeriaPort`…), qué datos pide y qué pasa si el proveedor cae.

## 7. Métricas y reportes que alimenta

## 8. Criterios de aceptación (verificables)
Lista numerada; cada uno con la prueba que lo demuestra (unitaria, contrato, E2E, captura).

## 9. Fuera de alcance y preguntas abiertas
