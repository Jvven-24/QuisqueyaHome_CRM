/**
 * Correo transaccional propio (Postfix + OpenDKIM en la VPS). Sin terceros.
 * SMTP_HOST/SMTP_PORT apuntan al relay local; nunca se registra el contenido.
 */
import nodemailer from "nodemailer";

type Env = Record<string, string | undefined>;

export function urlPublica(env: Env = process.env): string {
  const explicita = env.APP_PUBLIC_URL?.trim();
  if (explicita) return explicita.replace(/\/$/, "");
  const redirect = env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  return redirect ? new URL(redirect).origin : "http://localhost:3000";
}

export function correoConfigurado(env: Env = process.env): boolean {
  return Boolean(env.SMTP_HOST?.trim());
}

export type Correo = { para: string; asunto: string; texto: string; html: string };

export async function enviarCorreo(c: Correo, env: Env = process.env): Promise<void> {
  if (!correoConfigurado(env)) throw new Error("Correo sin configurar: falta SMTP_HOST.");
  const transporte = nodemailer.createTransport({
    host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 25), secure: false,
    ignoreTLS: env.SMTP_TLS === "off", tls: { rejectUnauthorized: false },
    name: "crm.quisqueyahome.com", disableFileAccess: true, disableUrlAccess: true,
  });
  await transporte.sendMail({
    from: env.SMTP_FROM || "Quisqueya Home CRM <no-reply@quisqueyahome.com>",
    to: c.para, subject: c.asunto, text: c.texto, html: c.html,
  });
}

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/** Plantilla sobria: un párrafo, un botón, el enlace en texto plano como respaldo. */
export function plantillaEnlace(titulo: string, cuerpo: string, boton: string, enlace: string, pie: string): Omit<Correo, "para"> {
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f5f3ee;font-family:Arial,sans-serif;color:#0f1b2d">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e6e1d6">
<tr><td style="padding:28px 32px"><p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#a07a2c">Quisqueya Home CRM</p>
<h1 style="margin:0 0 16px;font-size:22px">${esc(titulo)}</h1><p style="margin:0 0 24px;font-size:15px;line-height:1.5">${esc(cuerpo)}</p>
<a href="${esc(enlace)}" style="display:inline-block;background:#0f1b2d;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold">${esc(boton)}</a>
<p style="margin:24px 0 0;font-size:12px;color:#6b7280;line-height:1.5">${esc(pie)}<br>Si el botón no funciona, copia este enlace:<br><span style="word-break:break-all">${esc(enlace)}</span></p>
</td></tr></table></td></tr></table></body></html>`;
  return { asunto: titulo, texto: `${titulo}\n\n${cuerpo}\n\n${boton}: ${enlace}\n\n${pie}`, html };
}
