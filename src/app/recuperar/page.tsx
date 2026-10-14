"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";

export default function RecuperarPage() {
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correoEnviado, setCorreoEnviado] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEnviando(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();

    try {
      const res = await fetch("/api/auth/recuperar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "No se pudo procesar la solicitud de recuperación.");
      }

      setCorreoEnviado(email);
      setEnviado(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login-page min-h-screen">
      {/* Brand panel */}
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
          <p className="eyebrow">Seguridad y Acceso</p>
          <h1>Restablecimiento de credenciales</h1>
          <p>
            Garantizamos la protección y aislamiento de cada cuenta en el sistema de operación inmobiliaria privada.
          </p>
        </div>

        <small>Soporte técnico: soporte@quisqueyahome.do</small>
      </section>

      {/* Form panel */}
      <section className="login-panel flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md mx-auto">
          {enviado ? (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-xs">
                <CheckCircle2 className="size-8" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Revisa tu correo
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Si la dirección <strong className="text-slate-800">{correoEnviado}</strong> está registrada en Quisqueya Home, recibirás un enlace de un solo uso para configurar una nueva contraseña.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600">
                <p className="font-semibold text-slate-800 mb-1">¿No recibiste el correo?</p>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Revisa tu carpeta de spam o correo no deseado. El enlace caduca en 60 minutos por motivos de seguridad.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <ArrowLeft className="size-4" />
                  <span>Volver a Iniciar Sesión</span>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4 group"
                >
                  <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Volver al inicio de sesión</span>
                </Link>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Recuperar contraseña
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                  Ingresa tu correo institucional para enviarte las instrucciones de recuperación.
                </p>
              </div>

              <form className="space-y-4" onSubmit={onSubmit}>
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
                      <span>Enviando enlace...</span>
                    </>
                  ) : (
                    <span>Enviar instrucciones</span>
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
