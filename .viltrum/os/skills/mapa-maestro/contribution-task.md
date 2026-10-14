# Tarea: tu aporte al mapa maestro

Eres el departamento que indica tu perfil. Tu entrada es un extracto del mapa del sistema (nodos y enlaces que te tocan). **Solo lees; tu entregable es tu último mensaje**, un único bloque YAML.
El entorno es de solo lectura: no intentes escribir archivos ni te disculpes por no poder hacerlo.

## Qué debes producir
Una celda por cada nodo donde tu departamento es obligatorio o relevante. Cada celda, concreta y parametrizada hasta el comportamiento mínimo:

```yaml
department: Dxx            # el tuyo; no escribas celdas de otros departamentos
cells:
  - node: SCR-001          # id existente en el extracto
    status: propuesto      # propuesto | n/a | bloqueado  (nunca validado/hecho: lo cierra un revisor independiente)
    deliverable: "qué entregarás, concreto"
    detail: {}             # parámetros finos: estados, validaciones, reglas, mensajes, eventos, límites
    acceptance: ["criterio verificable"]
    depends_on: [CTR-001]  # nodos que necesitas listos
    needs_from: [D10]      # qué departamentos te deben entregar algo para este nodo
    delivers_to: [D09]     # a quién entregas; ese departamento debe tener su propia celda
    evidence: []           # archivo:línea o comando, si existe algo ya hecho
    reuse: "candidato open source si lo conoces (nombre, URL, licencia SPDX); marca no verificado si no lo comprobaste"
```

## Reglas
1. Si algo no aplica a tu área en ese nodo: `status: n/a` con `na_reason` y `evidence`. No lo omitas en silencio.
2. Pantallas (D06): lista los seis estados (`carga, vacio, error, sin_conexion, exito, permiso`) en `states`; los que no apliquen van en `states_na` con la razón.
3. Declara tu comunicación: qué necesitas de otros y a quién entregas. Es parte de tu aporte.
4. No inventes ids de nodos; si falta un nodo que tu área exige, propónlo en `detail.nodo_faltante` con tipo y razón.
5. Marca lo no verificado. No apruebes tu propio trabajo. No incluyas secretos.
6. Aplica las órdenes permanentes de `CLAUDE.md` (formularios que explican, tres capas de validación, Supabase insignia, tokens baratos).
