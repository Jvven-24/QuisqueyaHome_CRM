"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";

export default function NuevaClavePage() {
  const router = useRouter();
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mostrar1, setMostrar1] = useState(false);
  const [mostrar2, setMostrar2] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completado, setCompletado] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (nuevaPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden. Por favor, verifícalas.");
      return;
    }

    setEnviando(true);

    try {
      const q = new URLSearchParams(window.location.search);
      const response = await fetch("/api/auth/nueva-clave", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token_hash: q.get("token_hash"), type: q.get("type") ?? "recovery", password: nuevaPassword }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "No se pudo actualizar la contraseña.");
      }

      setCompletado(true);
      setTimeout(() => {
        router.push("/inicio");
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la contraseña.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login-page min-h-screen">
      <section className="login-brand">
        <div className="brand-lockup" aria-label="Quisqueya Home">
          <Image
            src="/brand/app-icon-192.png"
            alt="Quisqueya Home"
            width={48}
            height={48}
            priority
            className="size-12 shrink-0 rounded-2xl object-contain shadow-lg border border-gold-600/50 bg-navy-950 p-1"
          />
          <span>
            <strong>Quisqueya</strong>
            <small>Home CRM</small>
          </span>
        </div>

        <div>
          <p className="eyebrow">Seguridad de la cuenta</p>
          <h1>Actualización de contraseña</h1>
          <p>
            Define una contraseña robusta para resguardar la información de tus clientes y operaciones inmobiliarias.
          </p>
        </div>

        <small>Acceso cifrado de extremo a extremo</small>
      </section>

      <section className="login-panel flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md mx-auto">
          {completado ? (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-xs">
                <CheckCircle2 className="size-8" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  ¡Contraseña actualizada!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2">
                  Tus nuevas credenciales han sido guardadas. Te estamos redirigiendo al panel de control...
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/inicio"
                  className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all"
                >
                  Ir al Panel Inmediatamente
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Crear nueva contraseña
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                  Ingresa tu nueva clave de acceso de al menos 8 caracteres.
                </p>
              </div>

              <form className="space-y-4" onSubmit={onSubmit}>
                <div>
                  <label
                    htmlFor="nuevaPassword"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Nueva contraseña
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 size-4 text-slate-400 pointer-events-none" />
                    <input
                      id="nuevaPassword"
                      name="nuevaPassword"
                      type={mostrar1 ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-11 pl-9 pr-10 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 shadow-2xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrar1(!mostrar1)}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={mostrar1 ? "Ocultar contraseña" : "Ver contraseña"}
                      tabIndex={-1}
                    >
                      {mostrar1 ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmarPassword"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 size-4 text-slate-400 pointer-events-none" />
                    <input
                      id="confirmarPassword"
                      name="confirmarPassword"
                      type={mostrar2 ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-11 pl-9 pr-10 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-gold-600 focus:ring-1 focus:ring-gold-600 shadow-2xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrar2(!mostrar2)}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={mostrar2 ? "Ocultar contraseña" : "Ver contraseña"}
                      tabIndex={-1}
                    >
                      {mostrar2 ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs animate-in fade-in"
                  >
                    <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-white" />
                      <span>Guardando contraseña...</span>
                    </>
                  ) : (
                    <span>Establecer nueva contraseña</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
