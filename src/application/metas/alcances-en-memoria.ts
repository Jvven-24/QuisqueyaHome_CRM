import type { Reversible } from "../testing/reversible.ts";
import type { Equipo, MetaAlcance, ReglaAtribucion, RepositorioMetasAlcance } from "./alcances-puertos.ts";

export type AlcancesEnMemoria = RepositorioMetasAlcance & Reversible & {
  readonly metas: readonly MetaAlcance[];
  readonly equipos: readonly Equipo[];
  readonly reglas: readonly ReglaAtribucion[];
};

export function alcancesEnMemoria(semilla: { proyectos?: number[]; brokers?: number[]; equipos?: Equipo[]; reglas?: ReglaAtribucion[] } = {}): AlcancesEnMemoria {
  const proyectos = semilla.proyectos ?? [];
  const brokers = semilla.brokers ?? [];
  let metas: MetaAlcance[] = [];
  let equipos: Equipo[] = [...(semilla.equipos ?? [])];
  let reglas: ReglaAtribucion[] = [...(semilla.reglas ?? [])];
  let sig = 1;
  return {
    get metas() { return metas; },
    get equipos() { return equipos; },
    get reglas() { return reglas; },
    async existeAlcance(tipo, id) {
      return tipo === "project" ? proyectos.includes(id) : equipos.some((e) => e.id === id && e.isActive);
    },
    async fijarMetaAlcance(datos) {
      const { actorId: _actor, ...d } = datos; void _actor;
      const anterior = metas.find((m) => m.scopeType === d.scopeType && m.scopeId === d.scopeId && m.year === d.year && m.month === d.month);
      const meta: MetaAlcance = { ...d, id: anterior?.id ?? sig++ };
      metas = anterior ? metas.map((m) => (m === anterior ? meta : m)) : [...metas, meta];
      return { anterior, meta };
    },
    async eliminarMetaAlcance(id) {
      const m = metas.find((x) => x.id === id);
      metas = metas.filter((x) => x.id !== id);
      return m;
    },
    async noBrokers(ids) { return ids.filter((i) => !brokers.includes(i)); },
    async buscarEquipo(id) { return equipos.find((e) => e.id === id); },
    async existeSlugEquipo(slug, excepto) { return equipos.some((e) => e.slug === slug && e.id !== excepto); },
    async guardarEquipo({ id, name, slug, leaderId, memberIds }) {
      const nuevoId = id ?? Math.max(0, ...equipos.map((e) => e.id)) + 1;
      // Un broker, un equipo: se retira de cualquier otro.
      equipos = equipos.map((e) => (e.id === nuevoId ? e : { ...e, memberIds: e.memberIds.filter((m) => !memberIds.includes(m)) }));
      const equipo: Equipo = { id: nuevoId, name, slug, leaderId, isActive: true, memberIds: [...memberIds] };
      equipos = id != null ? equipos.map((e) => (e.id === id ? equipo : e)) : [...equipos, equipo];
      return equipo;
    },
    async versionesDeRegla() { return reglas.map((r) => r.version); },
    async publicarRegla({ version, scope, rule, config, actorId, cuando }) {
      const anterior = reglas.find((r) => r.isActive);
      reglas = reglas.map((r) => ({ ...r, isActive: false }));
      const regla: ReglaAtribucion = { id: reglas.length + 1, version, scope, rule, config, isActive: true, approvedBy: actorId, approvedAt: cuando };
      reglas = [...reglas, regla];
      return { anterior, regla };
    },
    instantanea() {
      const c = { metas, equipos, reglas };
      return () => { metas = c.metas; equipos = c.equipos; reglas = c.reglas; };
    },
  };
}
