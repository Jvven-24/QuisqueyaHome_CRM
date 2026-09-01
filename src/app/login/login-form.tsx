"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * Formulario de acceso (T2).
 *
 * Cliente porque necesita estado de envío y de error. La credencial no se
 * comprueba aquí: se envía al route handler, que es quien habla con Supabase.
 */
export function LoginForm() {
  const router = useRouter();
  const destino = useSearchParams().get("destino") ?? "/inicio";
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEnviando(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (response.ok) {
      // `refresh` antes de navegar: el layout de servidor tiene que releer la
      // sesión, si no se pinta el shell sin usuario.
      router.replace(destino);
      router.refresh();
      return;
    }

    const body = await response.json().catch(() => ({}));
    setError(body.error ?? "No se pudo iniciar sesión.");
    setEnviando(false);
  }

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="email">Correo</label>
      <input id="email" name="email" type="email" required autoComplete="email" />

      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>

      <a href="/recuperar">Olvidé mi contraseña</a>
    </form>
  );
}
