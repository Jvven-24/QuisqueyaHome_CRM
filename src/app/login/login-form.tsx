"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

import { AccessPreview } from "./access-preview";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pedido = searchParams.get("destino");
  const destino = pedido && /^\/(?![/\\])/.test(pedido) ? pedido : "/inicio";

  const submitLock = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    setError(null);
    setEnviando(true);

    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.replace(destino);
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => ({}));
      setError(typeof body.error === "string" ? body.error : "Credenciales incorrectas o cuenta no autorizada.");
    } catch {
      setError("No se pudo conectar con el servidor de autenticación.");
    } finally {
      submitLock.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <span className="inline-block px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-gold-700 bg-gold-50 border border-gold-200/80 rounded-md mb-3 font-mono">
          Operación Inmobiliaria Privada
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Iniciar sesión
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
          Ingresa tus credenciales de equipo para acceder a Quisqueya Desk.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} aria-busy={enviando}>
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Correo electrónico corporativo
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 size-4 text-slate-400 pointer-events-none" />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu-correo@quisqueyahome.do"
              className="w-full h-11 pl-9 pr-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 shadow-2xs transition-all"
            />
          </div>
        </div>

        {/* Password Field with Eye Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700"
            >
              Contraseña
            </label>
            <Link
              href="/recuperar"
              className="text-xs font-semibold text-gold-700 hover:text-gold-800 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 size-4 text-slate-400 pointer-events-none" />
            <input
              id="password"
              name="password"
              type={mostrarPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="w-full h-11 pl-9 pr-10 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 shadow-2xs transition-all"
            />
            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              className="absolute right-0 min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-1 focus:ring-gold-500 rounded"
              aria-label={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
              title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
              aria-pressed={mostrarPassword}
            >
              {mostrarPassword ? (
                <EyeOff className="size-4.5 text-slate-600" />
              ) : (
                <Eye className="size-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs animate-in fade-in"
          >
            <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={enviando}
          className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {enviando ? (
            <>
              <Loader2 className="size-4 animate-spin text-white" />
              <span>Verificando credenciales...</span>
            </>
          ) : (
            <span>Entrar al CRM</span>
          )}
        </button>
      </form>

      <AccessPreview />

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400">
          Uso exclusivo para corredores, administradores y personal autorizado de Quisqueya Home Real Estate.
        </p>
      </div>
    </div>
  );
}
