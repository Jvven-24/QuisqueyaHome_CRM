# Manual de administración — <proyecto>

> Escrito para alguien bajo presión, sin contexto previo del proyecto. Cada paso es
> literal. Si un paso da algo por sentado, el manual está incompleto.

## Audiencia

Este manual es para el rol de **administrador técnico**. No es el manual de usuario —
si buscas cómo usar el producto desde el rol de negocio, ver `manual-usuario.md`.

## Accesos necesarios

| Sistema | Cómo se obtiene el acceso | Rol requerido |
|---|---|---|
| Repositorio | | |
| VPS / servidor | | |
| Panel de DNS | | |
| Gestor de secretos | | |
| Proveedor de respaldo | | |
| Dashboard de observabilidad | | |

## Gestión de usuarios y permisos

```
Cómo crear un usuario administrador:
1. ...

Cómo revocar acceso:
1. ...

Catálogo de roles del sistema: <enlazar al catálogo real, nunca reescribirlo aquí>
```

## Configuración del sistema

| Variable/ajuste | Dónde se cambia | Requiere reinicio |
|---|---|---|
| | | |

## Respaldo y restauración

> Ver también el runbook técnico de D16/D11. Esta sección es la versión operativa
> para quien administra, no para quien desarrolla.

```
Frecuencia del respaldo automático: ___
Última restauración ensayada:       ___ (fecha)
Tiempo medido de restauración:      ___

Procedimiento paso a paso para restaurar:
1. Acceder a <sistema exacto> con <credencial exacta>
2. Ejecutar: <comando exacto>
3. Verificar: <cómo confirmar que la restauración fue correcta>
4. Si algo falla en el paso 2: <qué hacer, a quién escalar>
```

## Rotación de secretos

```
Procedimiento paso a paso:
1. ...
2. ...

Frecuencia recomendada: ___
Quién debe aprobar una rotación de emergencia: ___
```

## Monitoreo y alertas

| Dónde revisar el estado del sistema | Enlace |
|---|---|
| Dashboard de disponibilidad | |
| Dashboard de errores | |
| Índice de runbooks de alertas | `docs/runbooks/README.md` |

## Escalamiento

| Severidad | A quién avisar | Cómo (canal) | Tiempo esperado de respuesta |
|---|---|---|---|
| SEV1 | | | |
| SEV2 | | | |
| SEV3 | | | |

## Preguntas frecuentes de administración

<Se llena con lo que realmente pregunta el equipo del cliente después del handoff —
no se inventa por anticipado.>

## Verificación del criterio junior

```
Fecha del último intento de seguir este manual sin contexto previo: ___
Resultado: logrado / bloqueado en el paso ___
Corrección aplicada: ___
```
