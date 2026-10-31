"use client";

import { useState } from "react";
import { COMPANIES, type CompanyExample } from "../_ejemplo";
import { PageHeader, Avatar, Badge } from "../../_ui/prototipo-ui";
import { ModuleTabs } from "@/components/modulo";
import {
  Building2,
  Plus,
  Search,
  Users,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  X,
  FileText,
  UserPlus,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function EmpresasVista() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [selected, setSelected] = useState<CompanyExample | null>(null);
  const [creandoEmpresa, setCreandoEmpresa] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const sectoresDisponibles = Array.from(new Set(COMPANIES.map((c) => c.sector)));

  const rows = COMPANIES.filter(
    (c) =>
      (c.name + " " + c.email + " " + c.rnc).toLowerCase().includes(query.toLowerCase()) &&
      (!sector || c.sector === sector),
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto min-w-0">
      <PageHeader
        eyebrow="Private Desk · Identidades Corporativas"
        title="Empresas y Representación Legal"
        subtitle="Directorio patrimonial de firmas inmobiliarias, desarrolladoras, fondos y apoderados legales con vinculación comercial."
        action={
          <button
            type="button"
            onClick={() => setCreandoEmpresa(true)}
            className="min-h-12 px-5 inline-flex items-center gap-2.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-white text-[13.5px] font-bold shadow-sm transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-gold-700"
          >
            <Plus className="size-4 text-gold-500" />
            <span>Registrar empresa</span>
          </button>
        }
      />

      <ModuleTabs
        label="Gestión de contactos"
        items={[
          { href: "/contactos", label: "Personas" },
          { href: "/contactos/empresas", label: "Empresas y representantes", match: "prefix" },
          { href: "/contactos/demandas", label: "Demandas y matching", match: "prefix" },
        ]}
        className="mb-4"
      />

      {/* Barra de Búsqueda y Filtros Ejecutivos */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-surface border border-line rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-0 w-full max-w-md">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 size-4 text-slate-500 pointer-events-none" />
            <input
              type="search"
              aria-label="Buscar por razón social, RNC o correo"
              placeholder="Buscar por razón social, RNC o correo…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full min-h-12 pl-10 pr-3.5 text-[14px] font-medium bg-canvas border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-gold-700 focus:ring-2 focus:ring-gold-700/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            aria-label="Filtrar por sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="min-h-12 px-3.5 text-[13.5px] font-medium text-slate-900 bg-surface border border-input-line rounded-xl focus:outline-none focus:border-gold-700 cursor-pointer"
          >
            <option value="">Todos los sectores ({COMPANIES.length})</option>
            {sectoresDisponibles.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          {(query || sector) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSector("");
              }}
              className="min-h-12 px-4 inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink-muted hover:text-ink bg-surface border border-line rounded-xl transition-colors cursor-pointer"
            >
              <X className="size-4" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {aviso && (
        <div role="status" className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-[13.5px] font-semibold flex items-center justify-between">
          <span>{aviso}</span>
          <button type="button" onClick={() => setAviso(null)} className="text-emerald-900 underline text-xs">
            Cerrar
          </button>
        </div>
      )}

      {/* Directorio de Empresas: Tarjetas en Móvil y Tabla en Escritorio */}
      <div className="space-y-4">
        {/* Vista Móvil: Tarjetas Ejecutivas */}
        <div className="grid grid-cols-1 gap-4 sm:hidden">
          {rows.map((c) => (
            <article key={c.id} className="p-4 rounded-2xl border border-line bg-surface shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-navy-950 truncate">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-alt border border-line text-ink-muted">
                      RNC {c.rnc}
                    </span>
                    <span className="text-xs text-ink-muted font-medium">{c.sector}</span>
                  </div>
                </div>
                <Badge tone="green">{c.deals} negocios</Badge>
              </div>

              <div className="text-xs text-ink-muted space-y-1 pt-2 border-t border-line">
                <p>
                  <strong>Representantes:</strong> {c.people.map((p) => p.name).join(", ")}
                </p>
                <p>
                  <strong>Responsable:</strong> {c.owner}
                </p>
              </div>

              <div className="pt-2 border-t border-line flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelected(c)}
                  className="min-h-12 px-4 rounded-xl bg-navy-950 text-white text-xs font-bold hover:bg-navy-900 transition-colors"
                >
                  Ver expediente
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Vista de Escritorio: Tabla con Bordes y Espaciado de Lujo */}
        <div className="hidden sm:block rounded-2xl border border-line bg-surface overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-alt text-xs font-bold uppercase tracking-wider text-ink-muted">
                <th className="p-4">Empresa / Razón Social</th>
                <th className="p-4">Identidad Fiscal (RNC)</th>
                <th className="p-4">Representantes Autorizados</th>
                <th className="p-4">Responsable</th>
                <th className="p-4 text-center">Negocios</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-[13.5px]">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-surface-alt/60 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-navy-950 text-gold-400 font-bold flex items-center justify-center text-xs border border-gold-500/20 shadow-2xs">
                        <Building2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-sm font-bold text-navy-950 truncate">{c.name}</strong>
                        <span className="text-xs text-ink-muted">{c.sector} · {c.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-canvas border border-line text-slate-800">
                      {c.rnc}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="space-y-0.5">
                      {c.people.map((p) => (
                        <div key={p.name} className="flex items-center gap-1.5 text-xs text-ink">
                          <Users size={12} className="text-slate-400" />
                          <span><strong>{p.name}</strong> ({p.role})</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-700">{c.owner}</td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {c.deals} activos
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      className="min-h-11 px-3.5 rounded-xl border border-line bg-surface hover:bg-surface-alt text-xs font-bold text-navy-950 transition-colors"
                    >
                      Ver expediente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="p-10 text-center space-y-3">
              <Building2 className="size-10 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-ink-muted">
                No hay empresas que coincidan con la búsqueda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSector("");
                }}
                className="min-h-11 px-4 text-xs font-bold rounded-xl bg-navy-950 text-white"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Expediente de Empresa */}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg p-0 rounded-2xl overflow-hidden border-line bg-surface">
          <DialogHeader className="p-6 pb-4 border-b border-line bg-surface-alt">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-600">
              <Building2 className="size-4" />
              <span>Expediente Corporativo</span>
            </div>
            <DialogTitle className="text-xl font-bold text-navy-950 mt-1">
              {selected?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted">
              RNC: {selected?.rnc} · Contacto corporativo: {selected?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-5 text-sm">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Poderes y Representantes Legales
              </h4>
              <div className="space-y-2">
                {selected?.people.map((p) => (
                  <div
                    key={p.name}
                    className="p-3 rounded-xl border border-line bg-surface-alt flex items-center justify-between"
                  >
                    <div>
                      <strong className="block text-navy-950">{p.name}</strong>
                      <span className="text-xs text-ink-muted">{p.role}</span>
                    </div>
                    <Badge tone="green">Vigente</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-line bg-canvas text-xs text-ink-muted space-y-1">
              <p>
                <strong>Asesor responsable asignado:</strong> {selected?.owner}
              </p>
              <p>
                <strong>Negocios y expedientes patrimoniales:</strong> {selected?.deals} operaciones vinculadas.
              </p>
            </div>

            <div className="pt-2 border-t border-line flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setVinculando(true);
                  setAviso(`Vínculo de representante solicitado para ${selected?.name}.`);
                  setSelected(null);
                }}
                className="min-h-12 px-4 rounded-xl bg-navy-950 text-white text-xs font-bold hover:bg-navy-900 transition-colors inline-flex items-center gap-2"
              >
                <UserPlus size={14} />
                <span>Vincular representante</span>
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="min-h-12 px-4 rounded-xl border border-line bg-surface text-ink text-xs font-semibold hover:bg-surface-hover"
              >
                Cerrar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Registrar Empresa */}
      <Dialog open={creandoEmpresa} onOpenChange={setCreandoEmpresa}>
        <DialogContent className="max-w-md p-6 rounded-2xl border-line bg-surface">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-navy-950">
              Registrar Identidad Corporativa
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted">
              Alta de firma desarrolladora, constructora o apoderado en el directorio patrimonial.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              setAviso("Empresa registrada en el directorio de demostración.");
              setCreandoEmpresa(false);
            }}
          >
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Razón Social (obligatoria)
              </label>
              <input
                required
                placeholder="Ej. Inversiones Punta Cana S.R.L."
                className="w-full min-h-12 px-3 text-sm rounded-xl border border-slate-300 bg-canvas text-slate-900 focus:outline-none focus:border-gold-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                RNC o Identificador Fiscal
              </label>
              <input
                placeholder="Ej. 1-32-45678-9"
                className="w-full min-h-12 px-3 text-sm rounded-xl border border-slate-300 bg-canvas text-slate-900 focus:outline-none focus:border-gold-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Sector</label>
              <select className="w-full min-h-12 px-3 text-sm rounded-xl border border-slate-300 bg-canvas text-slate-900 focus:outline-none focus:border-gold-600 cursor-pointer">
                <option>Desarrollo inmobiliario</option>
                <option>Constructora</option>
                <option>Fondo de inversión</option>
                <option>Firma legal / Notaría</option>
                <option>Comercializadora</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreandoEmpresa(false)}
                className="min-h-12 px-4 rounded-xl border border-line bg-surface text-ink text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-12 px-5 rounded-xl bg-navy-950 text-white text-xs font-bold hover:bg-navy-900"
              >
                Guardar empresa
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
