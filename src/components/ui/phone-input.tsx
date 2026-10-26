"use client";

import { useState } from "react";
import {
  PAISES_TELEFONO,
  aplicarMascaraTelefono,
  descomponerTelefono,
  normalizarTelefono,
  obtenerConfigPaisTelefono,
  type CodigoPaisTelefono,
} from "@/domain/telefono";

type PhoneInputProps = {
  name?: string;
  defaultValue?: string | null;
  value?: string;
  onChangeValue?: (valorCompleto: string, e164: string | null, pais: CodigoPaisTelefono) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  mostrarGuia?: boolean;
};

/**
 * Selector de país + entrada telefónica con máscara en vivo y validación E.164.
 * Soporta República Dominicana (809/829/849) y la diáspora compradora
 * (EE.UU., Puerto Rico, Canadá, España, Colombia, México, Panamá, Europa y Sudamérica).
 */
export function PhoneInput({
  name = "phone",
  defaultValue = "",
  value,
  onChangeValue,
  required = false,
  disabled = false,
  id,
  className = "",
  mostrarGuia = true,
}: PhoneInputProps) {
  const inicial = descomponerTelefono(value !== undefined ? value : defaultValue);
  const [pais, setPais] = useState<CodigoPaisTelefono>(inicial.pais);
  const [digitos, setDigitos] = useState<string>(inicial.digitosLocales);
  const [tocado, setTocado] = useState(false);

  const config = obtenerConfigPaisTelefono(pais);
  const formateado = aplicarMascaraTelefono(digitos, pais);
  const valorCompleto = digitos.length > 0 ? `${config.prefijo} ${formateado}` : "";
  const normalizado = digitos.length > 0 ? normalizarTelefono(valorCompleto, pais) : { phone: null, phoneDisplay: null };

  const faltanDigitos = Math.max(0, config.digitosMin - digitos.length);
  const areaInvalidaRD =
    pais === "DO" &&
    digitos.length >= 3 &&
    !["809", "829", "849"].includes(digitos.slice(0, 3));

  function actualizar(nuevoPais: CodigoPaisTelefono, nuevosDigitosRaw: string) {
    const cfg = obtenerConfigPaisTelefono(nuevoPais);
    const limpios = nuevosDigitosRaw.replace(/\D/g, "").slice(0, cfg.digitosMax);
    setPais(nuevoPais);
    setDigitos(limpios);
    if (onChangeValue) {
      const fmt = aplicarMascaraTelefono(limpios, nuevoPais);
      const completo = limpios.length > 0 ? `${cfg.prefijo} ${fmt}` : "";
      const norm = limpios.length > 0 ? normalizarTelefono(completo, nuevoPais) : { phone: null, phoneDisplay: null };
      onChangeValue(completo, norm.phone, nuevoPais);
    }
  }

  function manejarCambioTexto(entradaUsuario: string) {
    const texto = entradaUsuario.trim();
    // Si el usuario pega un número completo con '+' (ej. +1 305 555 0100 o +34 612 34 56 78),
    // detectamos automáticamente el país y aplicamos su máscara.
    if (texto.startsWith("+") && texto.replace(/\D/g, "").length >= 4) {
      const detectado = descomponerTelefono(texto);
      actualizar(detectado.pais, detectado.digitosLocales);
      return;
    }

    const soloDigitos = entradaUsuario.replace(/\D/g, "");
    // Si está en DO y escribe un código de área de Miami/NY/PR de 10 dígitos, sugerimos o cambiamos a PR/US si pega 11 dígitos con 1
    if (
      pais === "DO" &&
      soloDigitos.length === 11 &&
      soloDigitos.startsWith("1") &&
      !["809", "829", "849"].includes(soloDigitos.slice(1, 4))
    ) {
      const area = soloDigitos.slice(1, 4);
      const nuevoPais: CodigoPaisTelefono = ["787", "939"].includes(area) ? "PR" : "US";
      actualizar(nuevoPais, soloDigitos.slice(1));
      return;
    }

    actualizar(pais, soloDigitos);
  }

  function manejarCambioPais(nuevoPais: CodigoPaisTelefono) {
    actualizar(nuevoPais, digitos);
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <input type="hidden" name={name} value={valorCompleto} />
      <div className="flex items-stretch gap-1.5">
        <select
          aria-label="País del teléfono"
          value={pais}
          disabled={disabled}
          onChange={(e) => manejarCambioPais(e.target.value as CodigoPaisTelefono)}
          className="min-h-12 shrink-0 cursor-pointer rounded-lg border border-input-line bg-surface-alt px-2.5 text-[13.5px] font-semibold text-navy-950 transition-colors hover:border-gold-500/60 focus-visible:outline-2 focus-visible:outline-gold-700"
        >
          {PAISES_TELEFONO.map((item) => (
            <option key={item.iso} value={item.iso}>
              {item.bandera} {item.iso} ({item.prefijo})
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required={required}
            disabled={disabled}
            value={formateado}
            placeholder={config.ejemplo}
            onBlur={() => setTocado(true)}
            onChange={(e) => manejarCambioTexto(e.target.value)}
            aria-label={`Número de teléfono (${config.nombre})`}
            aria-invalid={Boolean(tocado && digitos.length > 0 && !normalizado.phone)}
            className="min-h-12 w-full rounded-lg border border-input-line bg-surface px-3.5 font-mono text-[13.5px] text-ink tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-gold-700"
          />
        </div>
      </div>

      {mostrarGuia && (
        <div className="flex items-center justify-between gap-2 text-[13px]" aria-live="polite">
          {digitos.length === 0 ? (
            <span className="text-muted">
              Formato {config.nombre}: <span className="font-mono text-ink-soft">{config.prefijo} {config.ejemplo}</span>
            </span>
          ) : areaInvalidaRD ? (
            <span className="text-warning font-medium">
              En RD usa 809, 829 u 849 — o cambia el país a 🇺🇸 US (+1) si es de EE.UU.
            </span>
          ) : normalizado.phone ? (
            <span className="text-ok font-medium">
              WhatsApp y llamadas listas ({normalizado.phone})
            </span>
          ) : (
            <span className={tocado ? "text-danger font-medium" : "text-muted"}>
              Faltan {faltanDigitos} {faltanDigitos === 1 ? "dígito" : "dígitos"} para completar el formato de {config.nombre} ({config.prefijo})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
