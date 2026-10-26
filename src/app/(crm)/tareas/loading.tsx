import { EstadoCarga } from "../_ui/estados";

export default function TareasLoading() {
  return (
    <div className="space-y-6 p-2" aria-busy="true" aria-label="Cargando To-Do y tareas por broker">
      <EstadoCarga filas={6} tipo="tarjeta" />
    </div>
  );
}
