# <Nombre del proyecto>

<Una frase: qué problema resuelve y para quién.>

## Estado

```
Fase actual:     <F0-F8, ver core/lifecycle.md>
Ambiente activo: <dev | staging | prod>
Versión desplegada en producción: <tag>
```

## Requisitos

- <runtime y versión, ej. Node 20+>
- <Docker y Docker Compose>
- <acceso a las variables de entorno — ver `.env.example`>

## Instalación local

```bash
git clone <url>
cd <proyecto>
cp .env.example .env   # completar con los valores del gestor de secretos
docker compose up -d
```

## Verificar que corrió bien

```bash
curl http://localhost:<puerto>/health
# esperado: {"status":"ok"}
```

## Pruebas

```bash
<comando exacto>
```

## Estructura del repositorio

```
<árbol de carpetas principal, con una línea de qué contiene cada una>
```

## Cómo se despliega

Ver `docs/runbooks/runbook-release.md` (D16). Este README no duplica esos pasos.

## Documentación relacionada

| Documento | Contenido |
|---|---|
| Manual de usuario | `docs/manual-usuario.md` |
| Manual de administración | `docs/manual-administracion.md` |
| Arquitectura | `docs/arquitectura.md` |
| Índice de ADR | `docs/adr/README.md` |
| Runbooks operativos | `docs/runbooks/README.md` |

## A quién preguntar

| Área | Contacto |
|---|---|
| Producto | |
| Arquitectura/backend | |
| Infraestructura | |

## Licencia

<si aplica>
