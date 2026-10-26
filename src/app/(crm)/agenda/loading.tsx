import { EstadoCarga } from "../_ui/estados";

export default function AgendaLoading() {
  return (
    <div className="space-y-6 p-2" aria-busy="true" aria-label="Cargando agenda y visitas de brokers">
      <EstadoCarga filas={6} tipo="tabla" />
    </div>
  );
}
