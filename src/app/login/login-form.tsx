"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * Formulario de acceso (T2), maquetado en T5 con `.login-form` y las clases
 * de `globals.css`.
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
    <form className="login-form" onSubmit={onSubmit}>
      <p className="eyebrow">Bienvenido</p>
      <h2>Iniciar sesión</h2>

      <label htmlFor="email">Correo electrónico</label>
      <input id="email" name="email" type="email" required autoComplete="email" />

      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        required
        minLength={6}
        autoComplete="current-password"
      />

      {error && (
        <p role="alert" style={{ color: "var(--danger)", fontWeight: 700 }}>
          {error}
        </p>
      )}

      <button className="button primary wide" type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar al CRM"}
      </button>

      <a className="text-button" href="/recuperar">
        ¿Olvidaste tu contraseña?
      </a>
    </form>
  );
}
