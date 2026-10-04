# T-W4b-D21 · Plan de porte de Rentas desde OpenProperty (MIT)

Perfil: **D21 Research** (con apoyo de modelado). Modo: analysis. Revisor: D11 (otro proveedor).
Decisión: #43 (rentas entra). Arquitectura: `.viltrum/vre-os/ARQ-VRE-002-integraciones.md` §3 (código portado =
módulo nativo con cabecera de procedencia). Repo: `https://github.com/clawnify/OpenProperty` (MIT, verificado 4-oct).

## Qué entregar
1. SHA exacto evaluado (API GitHub `commits/HEAD`) y archivo LICENSE citado.
2. Inventario del repo: modelo de datos (properties, units, tenants, leases, rent ledger, payments, work orders,
   vendors), reglas (vencimientos, recargos por mora, depósitos, renovaciones), pantallas y pruebas que tenga.
   Para cada pieza: ruta en el repo, qué hace, si se porta (PORT), se reescribe o se descarta, y por qué.
3. **Mapeo a nuestro esquema** (`src/infrastructure/db/schema.ts`): qué tablas nuevas hacen falta (nombres en el
   estilo del esquema, con `public_id`, borrado lógico, RLS, montos en centavos USD/DOP), cómo se enlazan con
   `projects`/`units`/`contacts` existentes (una unidad vendida puede rentarse: el inversionista es contacto), y qué
   catálogos (estados de contrato, tipos de cargo) van en tabla.
4. Casos de uso para `src/application/rentas/` (puertos, casos de uso, consultas) siguiendo
   `src/application/README.md`, y vistas con tabs: Contratos · Cobros · Mantenimiento · Proveedores.
5. Datos simulados coherentes para el seed (≈60 contratos, 12 meses de cargos y pagos, mora realista ~8–12 %).
6. Riesgos y lo que OpenProperty **no** cubre (su README lo declara: sin pagos reales, sin portal de inquilino).

## Reglas
No clones dentro del repo del CRM (usa la API/raw de GitHub o un directorio temporal fuera). No modifiques nada
salvo el entregable. Cita ruta+SHA por cada afirmación sobre el código.

## Entregable
`.viltrum/vre-os/D21-rentas-porte.md` con secciones 1–6 y `## Fuentes`.
