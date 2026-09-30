/**
 * M1 · Contactos — lectura (`docs/F1_ANALISIS_Y_PLAN.md` paso 3).
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada, y el listado filtrado por `visibleRows` (§18.1) — nunca con un
 * `WHERE broker_id = ?` propio. Búsqueda, filtro de canal y paginación viven en
 * `searchParams`, no en estado de cliente: la URL es compartible y el filtro se
 * aplica en SQL, que es donde el permiso ya vive (`docs/contexto/decisiones.md`
 * #2). La consulta vive ahora en `application/contactos/consultas.ts` y su
 * adaptador; esta página solo parsea la URL y pinta.
 *
 * También resuelve, por `searchParams.contacto`, la ficha lateral: el
 * historial de auditoría (T6, `Historial`) es un componente de servidor, así
 * que la selección se lleva en la URL en vez de en estado de cliente — así
 * este archivo lo monta directamente, sin que `vista.tsx` tenga que volver a
 * pedirlo por su cuenta ni reimplementar lo que `Historial` ya hace.
 */

import { consultarListadoContactos, TAMANIO_PAGINA_CONTACTOS } from "@/application/contactos/consultas";
import { scopeFor } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { contactosParaLectura } from "@/infrastructure/contenedor/contactos";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { Historial } from "../_ui/historial";
import { ContactosVista } from "./vista";

export const metadata = { title: "Contactos · CRM Quisqueya Home" };

/** `searchParams` puede traer el mismo parámetro repetido; solo interesa el primero. */
function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function ContactosPage({
  searchParams,
}: {
  // Next 15: `searchParams` es una Promise (paso 3, instrucción del encargo).
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "contacts", "view");

  const params = await searchParams;
  const q = primero(params.q)?.trim() || "";
  const sourceIdParam = Number(primero(params.source_id));
  const sourceId = Number.isFinite(sourceIdParam) && sourceIdParam > 0 ? sourceIdParam : undefined;
  const paginaParam = Number(primero(params.page));
  const pagina = Number.isFinite(paginaParam) && paginaParam > 0 ? Math.trunc(paginaParam) : 1;
  const contactoIdParam = Number(primero(params.contacto));
  const contactoId = Number.isFinite(contactoIdParam) && contactoIdParam > 0 ? contactoIdParam : undefined;

  // Reasignar el responsable es de la deuda de F1 (issue #21), limitada a
  // alcance `all` (decisión de esa deuda): solo entonces vale la pena traer
  // la lista de brokers — evita la consulta en cada visita de un broker con
  // `own`, que nunca vería el selector.
  const puedeReasignar = scopeFor(actor, "contacts", "edit") === "all";

  const { contactos, total, canales, contactoSeleccionado, brokers } = await consultarListadoContactos(
    contactosParaLectura(),
    actor,
    scope,
    { q, sourceId, pagina, contactoId, incluirBrokers: puedeReasignar },
  );

  return (
    <ContactosVista
      contactos={contactos}
      canales={canales}
      total={total}
      tamanioPagina={TAMANIO_PAGINA_CONTACTOS}
      pagina={pagina}
      filtros={{ q, sourceId }}
      contactoSeleccionado={contactoSeleccionado ?? null}
      brokers={brokers}
      puedeReasignar={puedeReasignar}
      historial={
        contactoSeleccionado ? <Historial entidad="contact" entidadId={contactoSeleccionado.id} /> : null
      }
    />
  );
}
