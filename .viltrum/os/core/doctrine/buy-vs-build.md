# Todo está creado — construir, comprar, configurar o integrar

> Antes de escribir una línea, se investiga qué existe.
> Construir sin haber investigado es un hallazgo P2 contra quien lo hizo.

## Cuándo aplica

Siempre que aparezca una **capacidad nueva**: autenticación, pagos, facturación
electrónica, generación de PDF, editor de texto, calendario, tabla de datos, mapa,
notificaciones, colas, búsqueda, importación de archivos, gráficos, firma digital,
chat, carga de imágenes… y cualquier módulo completo.

No aplica a: lógica de negocio propia del cliente, que por definición no existe fuera.

## Procedimiento

### 1. Enunciar la capacidad, no la solución
❌ "Necesito instalar X librería"
✅ "Necesito que el usuario firme un documento y quede constancia verificable"

### 2. Buscar en cuatro frentes
| Frente | Qué se busca |
|---|---|
| **Ya lo tenemos** | ¿Existe en otro proyecto de Viltrum? ¿En la biblioteca de componentes? |
| **Open source** | Repositorio mantenido, con licencia compatible |
| **SaaS / API** | Servicio con API, precio y límites claros |
| **Nativo del stack** | ¿La plataforma ya lo resuelve? (Postgres, el framework, el navegador) |

### 3. Evaluar cada candidato

| Criterio | Peso | Qué mirar |
|---|---|---|
| Cobertura funcional | 20 | ¿Cuánto del requisito cubre sin modificar? |
| Licencia | 15 | Compatible con uso comercial y con el modelo de entrega |
| Mantenimiento | 15 | Último commit, frecuencia, issues abiertos, respaldo del proyecto |
| Seguridad | 15 | Vulnerabilidades conocidas, cadena de dependencias, superficie |
| Integración | 10 | API, webhooks, MCP, SDK del stack |
| Exportación y salida | 10 | ¿Puedo sacar mis datos y migrar si falla? |
| Costo a 3 años | 10 | Licencia + operación + mantenimiento, no solo el precio de hoy |
| Experiencia de uso | 5 | ¿Es aceptable para el usuario final sin rehacerlo? |

### 4. Decidir por puntuación

| Puntaje | Decisión |
|---|---|
| **80–100** | Integrar o configurar. Construir sería desperdicio. |
| **65–79** | Prueba técnica acotada antes de decidir |
| **50–64** | Híbrido: usar el núcleo, construir la capa propia encima |
| **< 50** | Construir, o seguir buscando |

### 5. Registrar el expediente

Sin expediente, la decisión no existe. Formato en `templates/research-dossier.md`.

Contenido mínimo: capacidad buscada, candidatos evaluados con enlaces, tabla de
puntuación, decisión, razón, riesgos asumidos y **plan de salida**.

## Regla del adaptador

Toda pieza externa que se integre entra **detrás de un contrato propio**.

```
Dominio  →  Puerto (interfaz propia)  →  Adaptador  →  Proveedor externo
```

Consecuencia práctica: cambiar de proveedor toca únicamente el adaptador.
Si el nombre del proveedor aparece fuera de `adapters/`, el diseño está mal.

Esto aplica a: base de datos, autenticación, correo, pagos, almacenamiento, mensajería,
modelos de IA, analítica, y cualquier servicio de terceros.

## Regla de la extracción

Cuando se toma código de un repositorio externo: **no se pega, se porta.**

1. Se entiende qué hace
2. Se extrae la capacidad, no el archivo
3. Se adapta a los contratos propios
4. Se le escriben pruebas propias
5. Se registra procedencia y licencia

Copiar y pegar sin entender es cómo entran los bugs que nadie sabe arreglar.

## Criterio de terminado

La decisión demuestra, con evidencia enlazada, por qué la alternativa elegida es más
rápida, más mantenible y de mejor valor total que las descartadas.
