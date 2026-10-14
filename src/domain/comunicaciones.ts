/**
 * Dominio puro de Comunicaciones y Plantillas Multicanal (M11).
 *
 * Sin dependencias externas, sin base de datos, sin Next.js.
 * Soporta Telegram Bot, WhatsApp, Email y Webhooks genéricos.
 */

export const CANALES_COMUNICACION = [
  "telegram",
  "whatsapp",
  "email",
  "sms",
  "webhook",
] as const;

export type CanalComunicacion = (typeof CANALES_COMUNICACION)[number];

export const VARIABLES_PLANTILLA_ESTANDAR = [
  "nombre",
  "proyecto",
  "precio_desde",
  "broker",
  "telefono",
  "enlace_portal",
  "fecha_cita",
  "hora_cita",
] as const;

/**
 * Reemplaza marcadores `{variable}` en un texto por sus valores correspondientes.
 * Si una variable no está en el mapa, se conserva el marcador original `{variable}`
 * para que el usuario o el revisor pueda detectarlo.
 */
export function renderizarPlantilla(
  cuerpo: string,
  variables: Record<string, string | number | null | undefined>,
): string {
  if (!cuerpo) return "";

  return cuerpo.replace(/\{([a-zA-Z0-9_]+)\}/g, (coincidencia, clave) => {
    const valor = variables[clave];
    if (valor === undefined || valor === null) {
      return coincidencia;
    }
    return String(valor);
  });
}

/**
 * Extrae todos los nombres de marcadores `{variable}` presentes en el texto.
 */
export function extraerVariablesDePlantilla(cuerpo: string): string[] {
  if (!cuerpo) return [];
  const encontrados = new Set<string>();
  const regex = /\{([a-zA-Z0-9_]+)\}/g;
  let coincidencia: RegExpExecArray | null;

  while ((coincidencia = regex.exec(cuerpo)) !== null) {
    if (coincidencia[1]) {
      encontrados.add(coincidencia[1]);
    }
  }

  return Array.from(encontrados);
}

/**
 * Genera un enlace directo para abrir conversación en Telegram (sin costo por mensaje).
 */
export function generarEnlaceTelegram(
  username: string,
  mensaje?: string,
): string {
  const usuarioLimpio = username.replace(/^@/, "").trim();
  if (!usuarioLimpio) return "";

  const base = `https://t.me/${encodeURIComponent(usuarioLimpio)}`;
  if (mensaje && mensaje.trim() !== "") {
    return `${base}?text=${encodeURIComponent(mensaje.trim())}`;
  }
  return base;
}

/**
 * Genera un enlace universal de WhatsApp (wa.me) con texto prellenado.
 */
export function generarEnlaceWhatsApp(
  telefonoE164: string,
  mensaje?: string,
): string {
  const digitos = telefonoE164.replace(/[^0-9]/g, "");
  if (!digitos) return "";

  const base = `https://wa.me/${digitos}`;
  if (mensaje && mensaje.trim() !== "") {
    return `${base}?text=${encodeURIComponent(mensaje.trim())}`;
  }
  return base;
}

/**
 * Valida si un token de bot de Telegram tiene el formato estándar oficial (ID:Hash).
 */
export function validarTokenTelegram(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  // Formato estándar: número de 8 a 10 dígitos seguido de ':' y 35 caracteres alfanuméricos/guiones
  const regexTelegramToken = /^\d{8,12}:[A-Za-z0-9_-]{34,36}$/;
  return regexTelegramToken.test(token.trim());
}

/**
 * Valida la configuración declarada de un canal de comunicación.
 */
export function validarConfiguracionCanal(
  canal: CanalComunicacion,
  config: Record<string, unknown>,
): { valido: boolean; error?: string } {
  if (!CANALES_COMUNICACION.includes(canal)) {
    return { valido: false, error: `Canal '${canal}' no soportado.` };
  }

  switch (canal) {
    case "telegram": {
      const botToken = String(config.botToken ?? "");
      if (!botToken) {
        return { valido: false, error: "El token del bot de Telegram es obligatorio." };
      }
      if (!validarTokenTelegram(botToken)) {
        return { valido: false, error: "Formato de token de Telegram inválido (debe ser tipo 123456789:ABCDefGhIjKLmnOPqrSTUVwxYZ)." };
      }
      return { valido: true };
    }

    case "whatsapp": {
      const token = String(config.apiToken ?? "");
      const phoneId = String(config.phoneNumberId ?? "");
      if (!token) {
        return { valido: false, error: "El Access Token de WhatsApp Cloud API es requerido." };
      }
      if (!phoneId) {
        return { valido: false, error: "El Phone Number ID de WhatsApp Cloud API es requerido." };
      }
      return { valido: true };
    }

    case "email": {
      const smtpHost = String(config.smtpHost ?? "");
      const user = String(config.user ?? "");
      if (!smtpHost || !user) {
        return { valido: false, error: "Host SMTP y usuario requeridos para el canal Email." };
      }
      return { valido: true };
    }

    case "webhook": {
      const url = String(config.url ?? "");
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return { valido: false, error: "La URL del webhook debe comenzar con http:// o https://" };
      }
      return { valido: true };
    }

    default:
      return { valido: true };
  }
}

/**
 * Destinatario apto para el registro de auditoría: suficiente para reconocer a
 * quién se escribió, insuficiente para reconstruir el contacto (teléfono,
 * correo, usuario de Telegram o URL del webhook completos son datos personales
 * o secretos y no se guardan en `audit_log`).
 */
export function enmascararDestinatario(canal: CanalComunicacion, destinatario: string): string {
  const valor = destinatario.trim();
  if (!valor) return "***";
  switch (canal) {
    case "email": {
      const arroba = valor.lastIndexOf("@");
      if (arroba < 1) return "***";
      return `${valor[0]}***${valor.slice(arroba)}`;
    }
    case "whatsapp":
    case "sms": {
      const digitos = valor.replace(/[^0-9]/g, "");
      return digitos.length >= 4 ? `***${digitos.slice(-3)}` : "***";
    }
    case "telegram": {
      const usuario = valor.replace(/^@/, "");
      return usuario.length >= 3 ? `@${usuario.slice(0, 2)}***` : "@***";
    }
    case "webhook": {
      try {
        return `${new URL(valor).origin}/***`;
      } catch {
        return "***";
      }
    }
  }
}

/**
 * Los mensajes de error del proveedor viajan al registro de auditoría: se
 * recortan y se les quitan fragmentos con forma de token de bot (`id:hash`).
 */
export function sanitizarErrorDespacho(error: string | undefined): string | null {
  if (!error) return null;
  return error.replace(/\d{6,}:[A-Za-z0-9_-]{20,}/g, "[token]").slice(0, 200);
}
