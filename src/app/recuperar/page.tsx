"use client";

import { useState } from "react";

export default function RecuperarPage() {
  const [enviado, setEnviado] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch("/api/auth/recuperar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    // Se confirma siempre, exista o no el correo: ver el route handler.
    setEnviado(true);
  }

  if (enviado) {
    return (
      <main>
        <h1>Revisa tu correo</h1>
        <p>Si esa dirección tiene cuenta, le llegará un enlace para cambiar la contraseña.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Recuperar contraseña</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
        <button type="submit">Enviar enlace</button>
      </form>
      <a href="/login">Volver</a>
    </main>
  );
}
