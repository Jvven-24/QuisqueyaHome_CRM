# Esquema de Puertos Dedicados del Ecosistema Quisqueya / Viltrum

> [!IMPORTANT]
> **Directriz de No Colisión:** Queda estrictamente prohibido utilizar los puertos comunes `3000`, `3001`, `5173`, `8000` u `8080` para los servicios permanentes del ecosistema, con el fin de evitar colisiones con proyectos y aplicaciones cotidianas del usuario.

## Asignación de Puertos (Rango Dedicado 9300 - 9399)

| Servicio | Puerto Dedicado | Puerto Anterior | Descripción | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Viltrum Design Studio (PXIL)** | `9300` | `3000` | Estudio de diseño, selector de componentes e interfaz PXIL. | En migración a 9300 |
| **QuisqueyaHome CRM** | `9301` | `3001` | CRM inmobiliario integral (Next.js App Router). | En migración a 9301 |
| **QuisqueyaHome PortalWeb** | `9305` | `5173` | Portal público y Quisqueya Studio CMS (Vite). | Asignado |
| **HAPI Web Hub** | `9306` | `3006` | Hub central de coordinación de perfiles agénticos. | Asignado |
| **Viltrum Agent Monitor** | `9310` | `4310` | Monitor de telemetría y ejecución en tiempo real de agentes. | Asignado |
| **Viltrum SDK Dashboard** | `9365` | `8765` | Consola interactiva del SDK Viltrum. | Asignado |
| **Túnel PostgreSQL Staging** | `55432` | `55432` | Enlace seguro SSH al cluster de base de datos en VPS. | Fijo |

## Script de Validación y Chequeo de Salud
Para verificar disponibilidad antes de levantar los servicios:
```powershell
Get-NetTCPConnection -LocalPort 9300,9301,9305,9306,9310,9365,55432 -ErrorAction SilentlyContinue | Select-Object LocalPort, State, OwningProcess
```
