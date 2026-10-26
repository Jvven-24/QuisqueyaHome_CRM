"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export function AccessPreview() {
  const [message, setMessage] = useState(false);
  return <div className="mt-5"><Dialog onOpenChange={() => setMessage(false)}><DialogTrigger asChild><button className="private-text-action w-full" type="button">¿Tienes una invitación de equipo?</button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Aceptar invitación · vista previa</DialogTitle><DialogDescription>Falta: validación del enlace de un solo uso, empresa invitante, rol previsto, caducidad y segundo factor. Esta vista no crea una cuenta ni concede acceso.</DialogDescription></DialogHeader><p>La identidad y el rol deben proceder de una invitación validada por el servidor. No introduzcas contraseñas ni datos personales en esta vista previa.</p><dl className="text-sm"><dt>Empresa invitante</dt><dd>Sin invitación validada</dd><dt>Rol y caducidad</dt><dd>Pendientes de validación</dd></dl><button type="button" className="button" onClick={() => setMessage(true)}>Comprobar invitación · vista previa</button>{message && <p role="status">No se ha aceptado ninguna invitación. Falta el servicio de validación y aceptación; utiliza el acceso de una cuenta autorizada.</p>}</DialogContent></Dialog></div>;
}
