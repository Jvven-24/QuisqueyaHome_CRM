"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, UserPlus } from "lucide-react";
import { Avatar, Badge, Modal } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";

export type RolOpcion = { id: number; name: string; slug: string; isProtected?: boolean };

export type UsuarioFila = {
  id: number;
  fullName: string;
  email: string;
  jobTitle: string | null;
  phone: string | null;
  isActive: boolean;
  authUserId: string | null;
  roleId: number;
  roleName: string;
  roleSlug: string;
  specialty: string | null;
  handlesRentals: boolean | null;
  monthlyTargetDeals: number | null;
};

export function UsuariosPanel({
  lista,
  roles,
  puedeEditar,
}: {
  lista: UsuarioFila[];
  roles: RolOpcion[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<UsuarioFila | null>(null);
  const [usuarioPorEliminar, setUsuarioPorEliminar] = useState<UsuarioFila | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [notificacion, setNotificacion] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  async function reenviarInvitacion(usuario: UsuarioFila) {
    setOcupado(usuario.id);
    setNotificacion(null);
    try {
      const respuesta = await fetch(`/api/usuarios/${usuario.id}/invitacion`, { method: "POST" });
      setOcupado(null);
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setNotificacion({ tipo: "error", texto: cuerpo.error ?? "No se pudo reenviar la invitación." });
        return;
      }
      setNotificacion({ tipo: "exito", texto: `Invitación reenviada a ${usuario.email}.` });
      router.refresh();
    } catch {
      setOcupado(null);
      setNotificacion({ tipo: "error", texto: "Error de red al reenviar la invitación." });
    }
  }

  async function alternarActivo(usuario: UsuarioFila) {
    setOcupado(usuario.id);
    setNotificacion(null);
    try {
      const respuesta = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !usuario.isActive }),
      });
      setOcupado(null);
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}));
        setNotificacion({ tipo: "error", texto: cuerpo.error ?? "No se pudo actualizar el estado del usuario." });
        return;
      }
      setNotificacion({
        tipo: "exito",
        texto: `Usuario ${usuario.fullName} ${!usuario.isActive ? "activado" : "desactivado"} correctamente.`,
      });
      router.refresh();
    } catch {
      setOcupado(null);
      setNotificacion({ tipo: "error", texto: "Error de red al actualizar estado del usuario." });
    }
  }

  async function confirmarEliminarUsuario() {
    if (!usuarioPorEliminar) return;
    const usuario = usuarioPorEliminar;
    setUsuarioPorEliminar(null);
    setOcupado(usuario.id);
    setNotificacion(null);

    try {
      const respuesta = await fetch(`/api/usuarios/${usuario.id}`, { method: "DELETE" });
      setOcupado(null);
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}));
        setNotificacion({ tipo: "error", texto: cuerpo.error ?? "No se pudo eliminar el usuario." });
        return;
      }
      setNotificacion({
        tipo: "exito",
        texto: `Usuario ${usuario.fullName} trasladado a la papelera lógica. No se borra físicamente.`,
      });
      router.refresh();
    } catch {
      setOcupado(null);
      setNotificacion({ tipo: "error", texto: "Error al comunicarse con el servidor para eliminar el usuario." });
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <p className="eyebrow" style={{ margin: "0 0 4px", fontSize: "12px" }}>Gobernanza RBAC</p>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "var(--navy-950)" }}>
            Gestión de Usuarios y Roles
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--muted)" }}>
            Alta por invitación, asignación de permisos y perfiles comerciales de asesores inmobiliarios.
          </p>
        </div>
        {puedeEditar && (
          <button
            className="button primary"
            type="button"
            onClick={() => setCreando(true)}
            style={{
              minHeight: "44px",
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <UserPlus size={16} />
            <span>Invitar Usuario</span>
          </button>
        )}
      </div>

      {notificacion && (
        <div
          role={notificacion.tipo === "error" ? "alert" : "status"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: notificacion.tipo === "error" ? "#FEF2F2" : "#ECFDF5",
            border: `1px solid ${notificacion.tipo === "error" ? "#FCA5A5" : "#6EE7B7"}`,
            color: notificacion.tipo === "error" ? "#991B1B" : "#065F46",
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          {notificacion.tipo === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notificacion.texto}</span>
        </div>
      )}

      {lista.length === 0 ? (
        <Vacio titulo="Sin usuarios todavía" texto="Invita al primero con “Invitar usuario”." />
      ) : (
        <div className="table-wrap" style={{ border: "1px solid var(--line)", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ fontSize: "12px" }}>Usuario</th>
                <th style={{ fontSize: "12px" }}>Rol Asignado</th>
                <th style={{ fontSize: "12px" }}>Estado</th>
                <th style={{ fontSize: "12px" }}>Invitación</th>
                {puedeEditar && <th style={{ textAlign: "right", fontSize: "12px" }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {lista.map((usuario) => (
                <tr key={usuario.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="table-person" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Avatar name={usuario.fullName} small />
                      <span>
                        <strong style={{ display: "block", color: "var(--navy-950)", fontSize: "14px" }}>
                          {usuario.fullName}
                        </strong>
                        <small style={{ color: "var(--muted)", fontSize: "13px" }}>{usuario.email}</small>
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{usuario.roleName}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge tone={usuario.isActive ? "green" : "neutral"}>
                      {usuario.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {usuario.authUserId ? (
                      <Badge tone="green">Aceptada</Badge>
                    ) : (
                      <div className="header-actions-inline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Badge tone="gold">Pendiente</Badge>
                        {puedeEditar && (
                          <button
                            className="text-button"
                            type="button"
                            disabled={ocupado === usuario.id}
                            onClick={() => void reenviarInvitacion(usuario)}
                            style={{ minHeight: "44px", fontSize: "13px", color: "var(--gold-700)" }}
                          >
                            Reenviar
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  {puedeEditar && (
                    <td className="table-actions" style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => setEditando(usuario)}
                          aria-label={`Editar usuario ${usuario.fullName}`}
                          title="Editar datos de usuario"
                          style={{ minHeight: "44px", minWidth: "44px" }}
                        >
                          ✎
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          disabled={ocupado === usuario.id}
                          onClick={() => void alternarActivo(usuario)}
                          aria-label={usuario.isActive ? `Desactivar ${usuario.fullName}` : `Activar ${usuario.fullName}`}
                          title={usuario.isActive ? "Desactivar acceso" : "Activar acceso"}
                          style={{ minHeight: "44px", minWidth: "44px" }}
                        >
                          {usuario.isActive ? "⏸" : "▶"}
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          disabled={ocupado === usuario.id}
                          onClick={() => setUsuarioPorEliminar(usuario)}
                          aria-label={`Eliminar ${usuario.fullName}`}
                          title="Mover a papelera lógica"
                          style={{ minHeight: "44px", minWidth: "44px", color: "var(--danger)" }}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmación para mover a papelera */}
      {usuarioPorEliminar && (
        <Modal
          title="Mover Usuario a Papelera Lógica"
          onClose={() => setUsuarioPorEliminar(null)}
        >
          <div style={{ display: "grid", gap: "14px" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--ink)", lineHeight: 1.5 }}>
              ¿Deseas enviar a la papelera al usuario <strong>{usuarioPorEliminar.fullName}</strong> ({usuarioPorEliminar.email})?
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
              El usuario quedará inactivo de inmediato y podrás restaurarlo en cualquier momento desde la sección <strong>Papelera de Reciclaje</strong>. Cero borrado físico garantizado.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px" }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setUsuarioPorEliminar(null)}
                style={{ minHeight: "44px", fontSize: "13px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() => void confirmarEliminarUsuario()}
                style={{ minHeight: "44px", fontSize: "13px", backgroundColor: "var(--danger)", borderColor: "var(--danger)" }}
              >
                Confirmar Envío a Papelera
              </button>
            </div>
          </div>
        </Modal>
      )}

      {creando && <FormularioUsuario roles={roles} onClose={() => setCreando(false)} />}
      {editando && <FormularioUsuario usuario={editando} roles={roles} onClose={() => setEditando(null)} />}
    </>
  );
}

export function FormularioUsuario({
  usuario,
  roles,
  onClose,
}: {
  usuario?: UsuarioFila;
  roles: RolOpcion[];
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [rolId, setRolId] = useState(usuario?.roleId ?? roles.find((r) => r.slug === "broker")?.id ?? roles[0]?.id);
  const editando = Boolean(usuario);
  const esBroker = roles.find((r) => r.id === rolId)?.slug === "broker";

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setEnviando(true);
    setErrores({});

    const form = formRef.current;
    const datos: Record<string, unknown> = Object.fromEntries(new FormData(form).entries());
    if (editando) datos.isActive = (form.elements.namedItem("isActive") as HTMLInputElement).checked;
    const handlesRentalsEl = form.elements.namedItem("handlesRentals") as HTMLInputElement | null;
    if (handlesRentalsEl) datos.handlesRentals = handlesRentalsEl.checked;

    const url = editando ? `/api/usuarios/${usuario!.id}` : "/api/usuarios";
    const respuesta = await fetch(url, {
      method: editando ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json().catch(() => ({}));
    setEnviando(false);

    if (!respuesta.ok) {
      setErrores(cuerpo.fields ?? { _: cuerpo.error ?? "No se pudo guardar el usuario." });
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="usuario-title">
        <div className="drawer-head">
          <h2 id="usuario-title" style={{ fontSize: "18px", fontWeight: 800 }}>
            {editando ? `Editar a ${usuario!.fullName}` : "Invitar Nuevo Usuario"}
          </h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar" style={{ minHeight: "44px", minWidth: "44px" }}>
            ×
          </button>
        </div>
        <form className="form-grid" ref={formRef} onSubmit={enviar} style={{ fontSize: "13px" }}>
          <label className="span-2" style={{ fontSize: "13px" }}>
            Nombre completo
            <input name="fullName" defaultValue={usuario?.fullName} required style={{ minHeight: "44px", fontSize: "13px" }} />
            {errores.fullName && <small style={{ color: "#b42318", fontSize: "13px" }}>{errores.fullName}</small>}
          </label>
          {!editando && (
            <label className="span-2" style={{ fontSize: "13px" }}>
              Correo electrónico
              <input name="email" type="email" required style={{ minHeight: "44px", fontSize: "13px" }} />
              {errores.email && <small style={{ color: "#b42318", fontSize: "13px" }}>{errores.email}</small>}
            </label>
          )}
          <label style={{ fontSize: "13px" }}>
            Rol en el sistema
            <select
              name="roleId"
              value={rolId}
              onChange={(e) => setRolId(Number(e.target.value))}
              style={{ minHeight: "44px", fontSize: "13px" }}
            >
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.name}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: "13px" }}>
            Cargo o posición
            <input name="jobTitle" defaultValue={usuario?.jobTitle ?? ""} style={{ minHeight: "44px", fontSize: "13px" }} />
          </label>
          <label className="span-2" style={{ fontSize: "13px" }}>
            Teléfono de contacto
            <input name="phone" defaultValue={usuario?.phone ?? ""} placeholder="809-555-0184" style={{ minHeight: "44px", fontSize: "13px" }} />
          </label>
          {esBroker && (
            <>
              <label style={{ fontSize: "13px" }}>
                Especialidad comercial
                <input name="specialty" defaultValue={usuario?.specialty ?? ""} placeholder="Proyectos en planos" style={{ minHeight: "44px", fontSize: "13px" }} />
              </label>
              <label style={{ fontSize: "13px" }}>
                Meta mensual (negocios)
                <input name="monthlyTargetDeals" type="number" min="0" defaultValue={usuario?.monthlyTargetDeals ?? 0} style={{ minHeight: "44px", fontSize: "13px" }} />
              </label>
              <label className="span-2 checkbox-inline" style={{ minHeight: "44px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <input name="handlesRentals" type="checkbox" defaultChecked={usuario?.handlesRentals ?? false} style={{ width: "20px", height: "20px" }} />
                <span>Maneja alquileres inmobiliarios</span>
              </label>
            </>
          )}
          {editando && (
            <label className="span-2 checkbox-inline" style={{ minHeight: "44px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <input name="isActive" type="checkbox" defaultChecked={usuario!.isActive} style={{ width: "20px", height: "20px" }} />
              <span>Usuario activo para acceso al sistema</span>
            </label>
          )}
          {errores._ && <small style={{ color: "#b42318", fontSize: "13px" }}>{errores._}</small>}
          <div className="form-actions span-2" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button className="button secondary" type="button" onClick={onClose} style={{ minHeight: "44px", fontSize: "13px" }}>
              Cancelar
            </button>
            <button className="button primary" type="submit" disabled={enviando} style={{ minHeight: "44px", fontSize: "13px" }}>
              {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Enviar invitación"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
