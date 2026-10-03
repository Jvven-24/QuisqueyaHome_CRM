"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const pedido = useSearchParams().get("destino");
  const destino = pedido && /^\/(?![/\\])/.test(pedido) ? pedido : "/inicio";
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
      router.replace(destino);
      router.refresh();
      return;
    }

    const body = await response.json().catch(() => ({}));
    setError(body.error ?? "No se pudo iniciar sesión.");
    setEnviando(false);
  }

  async function entrarDemo(role: "admin" | "broker" | "assistant") {
    setEnviando(true);
    await fetch("/api/auth/demo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.replace(destino);
    router.refresh();
  }

  return (
    <form className="login-form" onSubmit={onSubmit}>
      <p className="eyebrow">Bienvenido</p>
      <h2>Iniciar sesión</h2>

      <label htmlFor="email">Correo electrónico</label>
      <input id="email" name="email" type="email" required autoComplete="email" placeholder="tu-correo@quisqueyahome.do" />

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

      <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
        <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Acceso Rápido de Evaluación</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
          <button
            type="button"
            className="button secondary"
            style={{ fontSize: "0.75rem", padding: "0.5rem 0.25rem", textAlign: "center" }}
            onClick={() => entrarDemo("admin")}
            disabled={enviando}
          >
            Admin
          </button>
          <button
            type="button"
            className="button secondary"
            style={{ fontSize: "0.75rem", padding: "0.5rem 0.25rem", textAlign: "center" }}
            onClick={() => entrarDemo("broker")}
            disabled={enviando}
          >
            Broker
          </button>
          <button
            type="button"
            className="button secondary"
            style={{ fontSize: "0.75rem", padding: "0.5rem 0.25rem", textAlign: "center" }}
            onClick={() => entrarDemo("assistant")}
            disabled={enviando}
          >
            Asistente
          </button>
        </div>
      </div>
    </form>
  );
}
