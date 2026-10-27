export type EstadoProveedor = { id: string; nombre: string; proveedor: string; falta: string[]; conectado: boolean; modoPrueba: boolean };
/** Estado real de adaptadores elegidos por env. Solo nombres de variables, nunca valores. */
export function ProveedoresActivos({ estado }: { estado: EstadoProveedor[] }) {
  return (
    <section className="rounded-xl border border-line bg-surface-alt p-4" aria-labelledby="prov-activos">
      <h3 id="prov-activos" className="font-bold">Proveedores activos{estado[0]?.modoPrueba ? " · modo prueba" : ""}</h3>
      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {estado.map((p) => (
          <li key={p.id} className="flex min-w-0 flex-col gap-1 rounded-lg border border-line p-3">
            <span className="flex items-center justify-between gap-2"><strong>{p.nombre}</strong>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.conectado ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{p.conectado ? "Conectado" : "Pendiente"}</span></span>
            <span className="text-sm text-ink-muted">Adaptador: {p.proveedor}</span>
            {p.falta.length > 0 && <span className="break-all text-sm">Falta: {p.falta.join(", ")}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
