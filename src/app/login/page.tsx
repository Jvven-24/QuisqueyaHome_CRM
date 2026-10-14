import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { evaluationLoginAllowed } from "@/infrastructure/env";
import { LoginForm } from "./login-form";

export const metadata = { title: "Acceder · CRM Quisqueya Home" };

/**
 * Pantalla de acceso (T2, maquetada en T5). En entorno de evaluación local,
 * redirige directamente a Inicio como admin sin requerir credenciales.
 */
export default async function LoginPage() {
  const requestHeaders = await headers().catch(() => null);
  if (requestHeaders && evaluationLoginAllowed(requestHeaders.get("host"))) {
    redirect("/inicio");
  }
  return (
    <main className="login-page">
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
          <p className="eyebrow">Operación inmobiliaria privada</p>
          <h1>
            Tu equipo, cada oportunidad y el avance de obra en un solo lugar.
          </h1>
          <p>
            Un entorno de trabajo para dar seguimiento desde el primer
            contacto hasta el cierre.
          </p>
        </div>
        <small>Acceso exclusivo para el equipo de Quisqueya Home</small>
      </section>

      <section className="login-panel">
        {/* `useSearchParams` obliga a un límite de Suspense en el App Router. */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
