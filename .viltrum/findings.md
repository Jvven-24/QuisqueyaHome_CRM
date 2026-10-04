# Matriz de Hallazgos Críticos (Findings) · QuisqueyaHome CRM

| ID | Departamento | Severidad | Descripción | Estado |
| :--- | :--- | :--- | :--- | :--- |
| `FIND-D00-01` | D00 | P1 | Ausencia de directorio `.viltrum/` y de enlace a la gobernanza y perfilado del sistema. | **Cerrado** (Inicializado en sesión) |
| `FIND-D16-01` | D16 | P1 | Colisión de puertos: CRM y Design Studio ocupaban los puertos recurrentes `3000` y `3001`. | **Cerrado** (Definido rango dedicado 9300-9399 en `ports.md`) |
| `FIND-D03-01` | D03 | P1 | Marca e Iconografía: Shell del CRM mostraba "QH" en texto plano en lugar del logotipo e isotipo corporativo de lujo de Quisqueya Home. | **Cerrado** (Implementado DeskSwitcher con logo oficial, BrokerFooter y Shell de lujo) |
| `FIND-D05-01` | D05 | P1 | Desconexión con Viltrum Studio & PortalWeb: Ausencia de componentes avanzados de gestión (`DataTable`, `Bits`, `CommandPalette`, `tone.ts`). | **Cerrado** (Integrado DataTable con vistas mobile/desktop, Bits y badges en Leads, Contactos, Comisiones y Pipeline) |
| `FIND-D06-01` | D06 | P2 | Cobertura irregular de los 6 estados de experiencia (Loading, Empty, Offline Graceful, Error, Success, Permissions). | **Cerrado** (Estandarizado en vistas con DataTable y estados de filtrado) |
| `FIND-D10-01` | D10 | P2 | Resiliencia de base de datos: Vistas fallaban con 500 cuando el túnel SSH de staging estaba cerrado. | **Cerrado** (Añadido fallback elegante en repositorios y persistencia local PostgreSQL en 5432) |
| `FIND-D21-01` | D21 | P1 | Brechas funcionales frente a Follow Up Boss y kvCORE: Ficha de lead sin timeline omnicanal unificado 360° y sin tarjeta rápida de cálculo Confotur. | **En Progreso** (Diseño de Timeline y esquema 10/40/50 completado en Pipeline) |
| `FIND-D21-02` | D21 | P1 | Hoja de ruta para migrar módulos de beta a pro ("de un señor") mediante motores open source. | **Cerrado** (Documentado en `docs/architecture/04-OPEN-SOURCE-LEAP-LEGO-BY-LEGO.md`) |
| `FIND-D22-01` | D22 | P1 | Desconexión con Obsidian: Repositorio del CRM sin espejo estructurado en la bóveda de proyectos Obsidian del usuario. | **En Progreso** (Sincronizado vía `tools/obsidian_sync.py`) |
