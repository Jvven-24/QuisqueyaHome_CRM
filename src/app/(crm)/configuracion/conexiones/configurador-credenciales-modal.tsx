"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Check,
  Copy,
  ExternalLink,
  Info,
  Key,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Globe,
} from "lucide-react";

export type ProveedorClaves = "google" | "meta";

type InfoVariable = {
  codigo: string;
  nombreHumano: string;
  categoria: string;
  descripcion: string;
  ubicacionProveedor: string;
  enlaceDocumentacion: string;
  esSecreto: boolean;
  ejemplo: string;
};

const DICCIONARIO_VARIABLES: Record<ProveedorClaves, InfoVariable[]> = {
  google: [
    {
      codigo: "GOOGLE_OAUTH_CLIENT_ID",
      nombreHumano: "ID de Cliente OAuth 2.0",
      categoria: "Identidad del Cliente",
      descripcion: "Identificador público del cliente web en Google Cloud para autorizar accesos a Search Console, GA4, Gmail y Calendar.",
      ubicacionProveedor: "Google Cloud Console → APIs y Servicios → Credenciales → ID de cliente OAuth 2.0 (Aplicación web).",
      enlaceDocumentacion: "https://console.cloud.google.com/apis/credentials",
      esSecreto: false,
      ejemplo: "1234567890-abc123xyz.apps.googleusercontent.com",
    },
    {
      codigo: "GOOGLE_OAUTH_CLIENT_SECRET",
      nombreHumano: "Secreto del Cliente OAuth",
      categoria: "Credencial Privada",
      descripcion: "Clave secreta emparejada con el ID de cliente. Se usa exclusivamente desde el servidor del CRM para canjear códigos de autorización por tokens de acceso.",
      ubicacionProveedor: "Google Cloud Console → APIs y Servicios → Credenciales → En tu cliente web → Secreto de cliente.",
      enlaceDocumentacion: "https://console.cloud.google.com/apis/credentials",
      esSecreto: true,
      ejemplo: "GOCSPX-xxxxxxxxxxxxxxxxxxxx",
    },
    {
      codigo: "INTEGRATIONS_TOKEN_ENC_KEY",
      nombreHumano: "Clave Maestra de Cifrado AES-256",
      categoria: "Seguridad Criptográfica",
      descripcion: "Clave secreta utilizada por el CRM para cifrar tokens de actualización (refresh tokens) en reposo en la base de datos PostgreSQL.",
      ubicacionProveedor: "Generada de forma segura por el equipo técnico. 32 bytes aleatorios (ej. `openssl rand -hex 32`).",
      enlaceDocumentacion: "https://github.com/QuisqueyaHome",
      esSecreto: true,
      ejemplo: "a1b2c3d4e5f6... (64 caracteres hex)",
    },
    {
      codigo: "INTEGRATIONS_PUBLIC_URL",
      nombreHumano: "URL Pública Autorizada del CRM",
      categoria: "Redirección y Red",
      descripcion: "Dominio HTTPS público donde responde el CRM para recibir la vuelta de autorización de Google. En desarrollo local suele ser http://localhost:3000.",
      ubicacionProveedor: "Debe coincidir exactamente con el origen configurado en URIs de redireccionamiento autorizados de Google.",
      enlaceDocumentacion: "https://console.cloud.google.com/apis/credentials",
      esSecreto: false,
      ejemplo: "https://crm.quisqueyahome.com",
    },
  ],
  meta: [
    {
      codigo: "META_APP_ID",
      nombreHumano: "Identificador de Aplicación Meta (App ID)",
      categoria: "Identidad del Cliente",
      descripcion: "Identificador numérico de la app en Meta for Developers con los productos Facebook Login for Business y Marketing API habilitados.",
      ubicacionProveedor: "developers.facebook.com → Mis Apps → Tu App → Configuración básica → Identificador de la app.",
      enlaceDocumentacion: "https://developers.facebook.com/apps",
      esSecreto: false,
      ejemplo: "123456789012345",
    },
    {
      codigo: "META_APP_SECRET",
      nombreHumano: "Clave Secreta de Aplicación (App Secret)",
      categoria: "Credencial Privada",
      descripcion: "Secreto privado de la app para verificar llamadas a Graph API y validar intercambios de token con Meta.",
      ubicacionProveedor: "developers.facebook.com → Tu App → Configuración básica → Clave secreta de la app (Mostrar).",
      enlaceDocumentacion: "https://developers.facebook.com/apps",
      esSecreto: true,
      ejemplo: "32 caracteres hexadecimales",
    },
    {
      codigo: "META_LOGIN_CONFIG_ID",
      nombreHumano: "ID de Configuración de Inicio de Sesión",
      categoria: "Opcional (Facebook Login)",
      descripcion: "Configuración de inicio de sesión para empresas en Meta. Permite gestionar scopes de forma centralizada sin pedirlos individualmente.",
      ubicacionProveedor: "developers.facebook.com → Facebook Login for Business → Configuraciones.",
      enlaceDocumentacion: "https://developers.facebook.com/apps",
      esSecreto: false,
      ejemplo: "Config ID numérico (opcional)",
    },
    {
      codigo: "INTEGRATIONS_TOKEN_ENC_KEY",
      nombreHumano: "Clave Maestra de Cifrado AES-256",
      categoria: "Seguridad Criptográfica",
      descripcion: "Clave secreta utilizada por el CRM para cifrar tokens de Meta en la base de datos.",
      ubicacionProveedor: "Compartida entre integraciones. Generada con openssl rand -hex 32.",
      enlaceDocumentacion: "https://github.com/QuisqueyaHome",
      esSecreto: true,
      ejemplo: "64 caracteres hex",
    },
    {
      codigo: "INTEGRATIONS_PUBLIC_URL",
      nombreHumano: "URL Pública Autorizada del CRM",
      categoria: "Redirección y Red",
      descripcion: "Dominio público del CRM. Debe registrarse en URI de redireccionamiento de OAuth válidos en la consola de Meta.",
      ubicacionProveedor: "developers.facebook.com → Facebook Login → Configuración → URIs de redireccionamiento de OAuth válidos.",
      enlaceDocumentacion: "https://developers.facebook.com/apps",
      esSecreto: false,
      ejemplo: "https://crm.quisqueyahome.com",
    },
  ],
};

export function ConfiguradorCredencialesModal({
  abierto,
  onCerrar,
  proveedorInicial = "google",
  faltan,
}: {
  abierto: boolean;
  onCerrar: () => void;
  proveedorInicial?: ProveedorClaves;
  faltan: { google: string[]; meta: string[] };
}) {
  const [proveedor, setProveedor] = useState<ProveedorClaves>(proveedorInicial);
  const [copiadoUri, setCopiadoUri] = useState(false);

  const listaVariables = DICCIONARIO_VARIABLES[proveedor];
  const pendientesActuales = faltan[proveedor] ?? [];

  const hostActual = typeof window !== "undefined" ? window.location.origin : "https://crm.quisqueyahome.com";
  const uriCallback = `${hostActual}/api/integraciones/oauth/${proveedor}/callback`;

  async function copiarUri() {
    try {
      await navigator.clipboard.writeText(uriCallback);
      setCopiadoUri(true);
      setTimeout(() => setCopiadoUri(false), 2500);
    } catch {
      // noop
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-line bg-surface">
        <DialogHeader className="p-6 pb-4 border-b border-line bg-surface-alt">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
            <Key className="size-4" />
            <span>Centro de Credenciales y Conectores</span>
          </div>
          <DialogTitle className="text-xl font-bold text-navy-950 dark:text-foreground">
            Configuración de Claves y APIs Oficiales
          </DialogTitle>
          <DialogDescription className="text-sm text-ink-muted leading-relaxed">
            Las credenciales se administran de forma segura en las variables de entorno del servidor.
            Revisa el estado de cada clave y las URLs de redirección que debes autorizar en la consola de cada proveedor.
          </DialogDescription>

          {/* Selector de Proveedor */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => setProveedor("google")}
              className={`min-h-10 px-4 rounded-xl text-xs font-bold transition-all border ${
                proveedor === "google"
                  ? "bg-navy-950 text-white border-navy-950 shadow-xs"
                  : "bg-surface text-ink-muted hover:text-ink border-line"
              }`}
            >
              Google Cloud APIs
              {faltan.google.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono">
                  {faltan.google.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setProveedor("meta")}
              className={`min-h-10 px-4 rounded-xl text-xs font-bold transition-all border ${
                proveedor === "meta"
                  ? "bg-navy-950 text-white border-navy-950 shadow-xs"
                  : "bg-surface text-ink-muted hover:text-ink border-line"
              }`}
            >
              Meta for Developers (Facebook)
              {faltan.meta.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono">
                  {faltan.meta.length}
                </span>
              )}
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Bloque de URI de Redirección Autorizada */}
          <div className="p-4 rounded-xl border border-line bg-surface-alt space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-navy-950 dark:text-foreground flex items-center gap-1.5">
                <Globe className="size-3.5 text-gold-600" />
                URI de Redirección Autorizada (Callback OAuth)
              </span>
              <button
                type="button"
                onClick={copiarUri}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface border border-line text-ink hover:bg-surface-hover transition-colors"
              >
                {copiadoUri ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    <span>¡Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copiar URI</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-ink-muted">
              Pega exactamente esta dirección en la consola del proveedor en el campo{" "}
              <strong>“URIs de redireccionamiento autorizados”</strong>:
            </p>
            <div className="p-2.5 rounded-lg bg-canvas border border-line font-mono text-xs text-ink break-all select-all">
              {uriCallback}
            </div>
          </div>

          {/* Listado de Claves con Nombres Claros */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-navy-950 dark:text-foreground">
              Variables y Credenciales Requeridas
            </h3>

            <div className="space-y-3">
              {listaVariables.map((v) => {
                const estaPendiente = pendientesActuales.includes(v.codigo);
                return (
                  <article
                    key={v.codigo}
                    className={`p-4 rounded-xl border transition-all ${
                      estaPendiente
                        ? "border-amber-300/80 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-800/40"
                        : "border-line bg-surface"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-navy-950 dark:text-foreground m-0">
                            {v.nombreHumano}
                          </h4>
                          <span className="text-[11px] font-medium text-ink-muted bg-surface-alt px-2 py-0.5 rounded-md border border-line">
                            {v.categoria}
                          </span>
                        </div>
                        <code className="text-xs font-mono text-ink-muted mt-0.5 block">
                          {v.codigo}
                        </code>
                      </div>

                      {estaPendiente ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300/80">
                          <AlertTriangle className="size-3.5" />
                          Pendiente de configurar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80">
                          <ShieldCheck className="size-3.5" />
                          Configurada en servidor
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-ink-muted leading-relaxed mb-3">
                      {v.descripcion}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60 text-xs">
                      <span className="text-ink-muted">
                        <strong>Dónde ubicarla:</strong> {v.ubicacionProveedor}
                      </span>
                      {v.enlaceDocumentacion && (
                        <a
                          href={v.enlaceDocumentacion}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-gold-700 hover:text-gold-800 underline underline-offset-4"
                        >
                          <span>Abrir consola</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Guía Rápida para el Administrador */}
          <div className="p-4 rounded-xl border border-line bg-canvas space-y-2 text-xs text-ink-muted">
            <h4 className="font-bold text-navy-950 dark:text-foreground flex items-center gap-1.5">
              <Info className="size-4 text-gold-600" />
              ¿Cómo agregar estas claves al entorno?
            </h4>
            <p>
              Agrega las variables en el archivo <code className="font-mono text-ink">.env</code> o en el panel de variables de entorno de tu servidor de producción (Vercel, VPS o Docker). Reinicia el servicio para que surtan efecto.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-line bg-surface-alt flex justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="min-h-11 px-5 rounded-xl bg-navy-950 text-white text-xs font-bold hover:bg-navy-900 transition-colors"
          >
            Entendido, cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
