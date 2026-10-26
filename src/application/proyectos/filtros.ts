export function filtrarProyectos<T extends { name: string; zone: string | null; projectType: string }>(proyectos: readonly T[], zona: string, tipo?: string): T[] {
  const normalizar = (valor: string) => valor.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
  const consulta = normalizar(zona.trim());
  return proyectos.filter(p => (!consulta || normalizar(p.name + " " + (p.zone ?? "")).includes(consulta)) && (!tipo || p.projectType === tipo));
}
