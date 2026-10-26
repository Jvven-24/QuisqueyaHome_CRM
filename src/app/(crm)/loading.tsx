import { EstadoCarga } from "./_ui/estados";

export default function CrmModuleLoading() {
  return (
    <div className="space-y-6 p-2" aria-busy="true" aria-label="Cargando módulo del CRM">
      <EstadoCarga filas={6} tipo="tarjeta" />
    </div>
  );
}
