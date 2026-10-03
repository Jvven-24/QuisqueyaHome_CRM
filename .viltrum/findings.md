# Matriz de Hallazgos Críticos (Findings) · QuisqueyaHome CRM

| ID | Departamento | Severidad | Descripción | Estado |
| :--- | :--- | :--- | :--- | :--- |
| `FIND-D00-01` | D00 | P1 | Ausencia de directorio `.viltrum/` y de enlace a la gobernanza y perfilado del sistema. | **Cerrado** (Inicializado en sesión) |
| `FIND-D16-01` | D16 | P1 | Colisión de puertos: CRM y Design Studio ocupaban los puertos recurrentes `3000` y `3001`. | **Cerrado** (Definido rango dedicado 9300-9399 en `ports.md`) |
| `FIND-D03-01` | D03 | P1 | Marca e Iconografía: Shell del CRM mostraba "QH" en texto plano en lugar del logotipo e isotipo corporativo de lujo de Quisqueya Home. | **En Progreso** (Rediseño de Shell D03/D09) |
| `FIND-D05-01` | D05 | P1 | Desconexión con Viltrum Studio & PortalWeb: Ausencia de componentes avanzados de gestión (`DataTable`, `Bits`, `CommandPalette`, `tone.ts`). | **En Progreso** (Integración de biblioteca PXIL/Studio) |
| `FIND-D06-01` | D06 | P2 | Cobertura irregular de los 6 estados de experiencia (Loading, Empty, Offline Graceful, Error, Success, Permissions). | **En Progreso** (Estandarización D06) |
| `FIND-D10-01` | D10 | P2 | Resiliencia de base de datos: Vistas fallaban con 500 cuando el túnel SSH de staging estaba cerrado. | **Cerrado** (Añadido fallback elegante en repositorios) |
| `FIND-D21-01` | D21 | P1 | Brechas funcionales frente a Follow Up Boss y kvCORE: Ficha de lead sin timeline omnicanal unificado 360° y sin tarjeta rápida de cálculo Confotur. | **Abierto** (En diseño D21/D02) |
| `FIND-D22-01` | D22 | P1 | Desconexión con Obsidian: Repositorio del CRM sin espejo estructurado en la bóveda de proyectos Obsidian del usuario. | **En Progreso** (Generación de Vault D22) |
