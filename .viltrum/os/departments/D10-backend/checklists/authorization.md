# Checklist — autorización

> Firma D12, nunca D10. Se aplica a todo endpoint que lee o muta un recurso protegido.
> "Lo verifiqué mentalmente" no es evidencia — la prueba de cruce ejecutada sí.

## A. Modelo de permisos

- [ ] El modelo (RBAC, ABAC, o híbrido) está decidido y escrito, no improvisado endpoint
      por endpoint
- [ ] **RBAC** (roles → permisos) para la mayoría de los casos: roles como catálogo único,
      permisos asociados al rol, no al usuario individual
- [ ] **ABAC** (atributos: tenant, propietario, estado del recurso, contexto) donde RBAC no
      alcanza — ej. "el autor puede editar su propio comentario mientras esté en borrador"
- [ ] El catálogo de roles tiene **una sola fuente** (base de datos o configuración
      versionada), nunca definido dos veces en el código

## B. Verificación en servidor, siempre

- [ ] Todo permiso se verifica en el servidor, en cada request — nunca se confía en que
      el cliente ocultó un botón o deshabilitó una opción
- [ ] La verificación ocurre **antes** de tocar el recurso, no después de haberlo devuelto
- [ ] Los roles y permisos se comparan contra catálogo tipado o enum — **nunca strings
      sueltos comparados por texto** (`if (role == "admin")` repetido en veinte archivos es
      el antipatrón; una función/política central que resuelve el permiso es la corrección)
- [ ] El resultado de una verificación de permiso en el cliente (mostrar/ocultar UI) nunca
      se usa como señal de autorización real en el servidor

## C. Mínimo privilegio

- [ ] Cada rol tiene solo los permisos que su función requiere, no un superconjunto "por si
      acaso"
- [ ] Los roles de servicio (cuentas técnicas, integraciones, workers) tienen permisos
      acotados a lo que ejecutan, no credenciales de administrador reutilizadas
- [ ] El rol de conexión de la aplicación a la base de datos no es el superusuario
      (coordinación con D11)
- [ ] Permisos temporales o elevados (impersonar, soporte) están acotados en el tiempo,
      registrados y revocables

## D. Aislamiento por recurso — BOLA/IDOR ejecutado, no solo revisado

Esto no se declara: **se ejecuta una prueba que intenta cruzar el permiso y confirma que
falla**, por cada tipo de recurso mutable.

- [ ] Por cada endpoint que recibe un ID de recurso: prueba que autentica como Usuario A,
      intenta leer/modificar/borrar un recurso que pertenece a Usuario B, y confirma
      respuesta de rechazo (404, no 403 — ver `AGENTS.md` punto 3)
- [ ] Por cada endpoint multi-tenant: prueba que autentica en el Tenant 1, intenta acceder
      a un recurso del Tenant 2, y confirma rechazo
- [ ] Por cada rol con permisos reducidos: prueba que intenta ejecutar una acción reservada
      a un rol superior, y confirma rechazo
- [ ] Las pruebas de cruce corren en CI, no son un ejercicio manual que se hizo una vez
- [ ] El resultado de estas pruebas es la evidencia que se adjunta al handoff — "lo revisé"
      no cuenta (`core/evidence-contract.md`)

## E. Filtrado en el origen, no en memoria

- [ ] El filtro de propiedad/tenant se aplica en la consulta a la base de datos
      (`WHERE owner_id = :usuario_actual`), nunca trayendo todo y filtrando después en
      código de aplicación
- [ ] Donde el motor lo soporta, hay una política de seguridad a nivel de fila como
      segunda capa (coordinación con D11) — el servidor no es la única barrera

## F. Escalamiento de privilegios

- [ ] Un usuario no puede asignarse a sí mismo un rol superior a través de un endpoint de
      edición de perfil u otro campo editable
- [ ] Los campos que determinan rol o permiso están excluidos explícitamente de cualquier
      "actualización masiva" (mass assignment) — se asignan por endpoints separados con su
      propia verificación
- [ ] La creación de un recurso no permite fijar su propietario a otro usuario distinto del
      que hace la petición, salvo permiso explícito de administración

## G. Consistencia entre lectura y escritura

- [ ] Si un usuario no puede ver un recurso, tampoco puede inferir su existencia por un
      código de error distinto entre "no existe" y "existe pero no es tuyo"
- [ ] Las respuestas de listados no incluyen recursos que el usuario no podría leer
      individualmente
- [ ] Los conteos y agregados no filtran cantidades de recursos ajenos (ej. "tienes 3
      facturas pendientes" no debe ser calculable para el tenant de otro)

## H. Pruebas de aceptación mínimas por proyecto

- [ ] Al menos un caso de BOLA/IDOR ejecutado por cada entidad mutable del dominio
- [ ] Al menos un caso de escalamiento de rol intentado y rechazado
- [ ] Al menos un caso de aislamiento de tenant, si el proyecto es multi-tenant
- [ ] Los tres casos anteriores están en `evals/cases.md` o en la suite de pruebas del
      proyecto, con su criterio de aprobado

---

## Veredicto

```
APROBADO      — checklist completa, con pruebas de cruce ejecutadas y evidencia enlazada
CONDICIONAL   — excepciones con dueño y fecha. Nunca con P0
RECHAZADO     — vuelve a D10 con hallazgos clasificados
```

Firma **D12**, nunca quien implementó el control de acceso.
