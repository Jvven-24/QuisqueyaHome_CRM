# D16 · Política y Asignación de Puertos No Recurrentes · Ecosistema Viltrum & Quisqueya

**Fecha:** 2026-10-03  
**Perfil:** D16 DevOps & Entornos Locales  
**Revisor Independiente:** D00 Control Plane  
**Estado:** Activo y Vigente

---

## 1. Problema de Colisión de Puertos
El uso de puertos genéricos como `3000` (Next.js por defecto) y `3001` genera fricción constante: cuando el usuario inicia cualquier otra aplicación o prototipo web en su máquina, los procesos colisionan o fallan silenciosamente.

## 2. Rango Dedicado del Ecosistema: 9300 – 9399
Se establece que todos los servicios satélites del ecosistema Quisqueya / Viltrum operen de forma inmutable en el rango **9300-9399**, que se encuentra libre de asignaciones IANA comunes y herramientas estándar:

| Servicio | Puerto Asignado | URL Local | Descripción |
| :--- | :--- | :--- | :--- |
| **Viltrum Design Studio** | `9300` | `http://localhost:9300` | Motor visual y galería de componentes PXIL. |
| **QuisqueyaHome CRM** | `9301` | `http://localhost:9301` | Aplicación principal Next.js CRM. |
| **QuisqueyaHome PortalWeb** | `9305` | `http://localhost:9305` | Portal público y Quisqueya Studio CMS. |
| **HAPI Web Hub** | `9306` | `http://127.0.0.1:9306` | Orquestador y despachador de perfiles Viltrum. |
| **Viltrum Agent Monitor** | `9310` | `http://127.0.0.1:9310` | Monitor de actividad agéntica y telemetría. |
| **Viltrum SDK Dashboard** | `9365` | `http://127.0.0.1:9365` | Consola interactiva del SDK Viltrum. |
| **Túnel Staging DB** | `55432` | `127.0.0.1:55432` | Túnel SSH hacia PostgreSQL en VPS Hostinger. |

## 3. Chequeo Previo de Puertos
Antes de levantar cualquier servicio daemon, el script de arranque debe ejecutar:
```powershell
Get-NetTCPConnection -LocalPort 9300,9301,9305,9306,9310,9365,55432 -ErrorAction SilentlyContinue
```
Garantizando que no existan procesos huérfanos o puertos retenidos.
