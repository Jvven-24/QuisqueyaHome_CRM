/**
 * Normalización y enmascarado de teléfono a E.164 para República Dominicana y
 * la diáspora compradora (EE.UU., Puerto Rico, Canadá, España, Colombia, etc.).
 *
 * Función pura, sin dependencias externas — decisión #19 de `docs/contexto/decisiones.md`
 * descarta `libphonenumber-js` (~500 KB) a favor de un catálogo compacto del
 * dominio inmobiliario dominicano y sus mercados emisores.
 *
 * Regla de certeza:
 * - Sin prefijo `+` ni país explícito, solo se normaliza a E.164 cuando los 10
 *   dígitos pertenecen a RD (`809`, `829`, `849`). Un número suelto de 10 dígitos
 *   como `305-555-0100` sin `+1` conserva `phone: null` y `phoneDisplay` intacto
 *   para no adivinar el país.
 * - Cuando la entrada incluye prefijo internacional explícito (`+1 305...`,
 *   `+34 612...`, `+57 310...`) o se indica `paisIso` desde el selector de país,
 *   se valida la longitud del país y se normaliza a E.164 (`+XXXXXXXXXXX`).
 */

const CODIGOS_AREA_RD = ["809", "829", "849"];
const CODIGOS_AREA_PR = ["787", "939"];

export type CodigoPaisTelefono =
  | "DO"
  | "US"
  | "PR"
  | "CA"
  | "ES"
  | "CO"
  | "MX"
  | "PA"
  | "VE"
  | "CL"
  | "AR"
  | "PE"
  | "IT"
  | "FR"
  | "DE"
  | "CH"
  | "GB";

export type ConfigPaisTelefono = {
  iso: CodigoPaisTelefono;
  nombre: string;
  prefijo: string;
  digitosPrefijo: string;
  bandera: string;
  /** Patrón donde cada `#` representa un dígito local. */
  mascara: string;
  ejemplo: string;
  digitosMin: number;
  digitosMax: number;
};

export const PAISES_TELEFONO: readonly ConfigPaisTelefono[] = [
  {
    iso: "DO",
    nombre: "República Dominicana",
    prefijo: "+1",
    digitosPrefijo: "1",
    bandera: "🇩🇴",
    mascara: "(###) ###-####",
    ejemplo: "(809) 555-0184",
    digitosMin: 10,
    digitosMax: 10,
  },
  {
    iso: "US",
    nombre: "Estados Unidos",
    prefijo: "+1",
    digitosPrefijo: "1",
    bandera: "🇺🇸",
    mascara: "(###) ###-####",
    ejemplo: "(305) 555-0100",
    digitosMin: 10,
    digitosMax: 10,
  },
  {
    iso: "PR",
    nombre: "Puerto Rico",
    prefijo: "+1",
    digitosPrefijo: "1",
    bandera: "🇵🇷",
    mascara: "(###) ###-####",
    ejemplo: "(787) 555-0192",
    digitosMin: 10,
    digitosMax: 10,
  },
  {
    iso: "CA",
    nombre: "Canadá",
    prefijo: "+1",
    digitosPrefijo: "1",
    bandera: "🇨🇦",
    mascara: "(###) ###-####",
    ejemplo: "(416) 555-0140",
    digitosMin: 10,
    digitosMax: 10,
  },
  {
    iso: "ES",
    nombre: "España",
    prefijo: "+34",
    digitosPrefijo: "34",
    bandera: "🇪🇸",
    mascara: "### ## ## ##",
    ejemplo: "612 34 56 78",
    digitosMin: 9,
    digitosMax: 9,
  },
  {
    iso: "CO",
    nombre: "Colombia",
    prefijo: "+57",
    digitosPrefijo: "57",
    bandera: "🇨🇴",
    mascara: "### ### ####",
    ejemplo: "310 555 0199",
    digitosMin: 10,
    digitosMax: 10,
  },
  {
    iso: "MX",
    nombre: "México",
    prefijo: "+52",
    digitosPrefijo: "52",
    bandera: "🇲🇽",
    mascara: "## #### ####",
    ejemplo: "55 5555 0142",
    digitosMin: 10,
    digitosMax: 10,
  },
  {
    iso: "PA",
    nombre: "Panamá",
    prefijo: "+507",
    digitosPrefijo: "507",
    bandera: "🇵🇦",
    mascara: "####-####",
    ejemplo: "6123-4567",
    digitosMin: 7,
    digitosMax: 8,
  },
  {
    iso: "VE",
    nombre: "Venezuela",
    prefijo: "+58",
    digitosPrefijo: "58",
    bandera: "🇻🇪",
    mascara: "###-###-####",
    ejemplo: "412-555-0188",
    digitosMin: 10,
    digitosMax: 10,
  },
  {
    iso: "CL",
    nombre: "Chile",
    prefijo: "+56",
    digitosPrefijo: "56",
    bandera: "🇨🇱",
    mascara: "# #### ####",
    ejemplo: "9 5555 0177",
    digitosMin: 9,
    digitosMax: 9,
  },
  {
    iso: "AR",
    nombre: "Argentina",
    prefijo: "+54",
    digitosPrefijo: "54",
    bandera: "🇦🇷",
    mascara: "## ####-####",
    ejemplo: "11 5555-0190",
    digitosMin: 10,
    digitosMax: 10,
  },
  {
    iso: "PE",
    nombre: "Perú",
    prefijo: "+51",
    digitosPrefijo: "51",
    bandera: "🇵🇪",
    mascara: "### ### ###",
    ejemplo: "987 654 321",
    digitosMin: 9,
    digitosMax: 9,
  },
  {
    iso: "IT",
    nombre: "Italia",
    prefijo: "+39",
    digitosPrefijo: "39",
    bandera: "🇮🇹",
    mascara: "### ### ####",
    ejemplo: "333 555 0144",
    digitosMin: 9,
    digitosMax: 10,
  },
  {
    iso: "FR",
    nombre: "Francia",
    prefijo: "+33",
    digitosPrefijo: "33",
    bandera: "🇫🇷",
    mascara: "# ## ## ## ##",
    ejemplo: "6 12 34 56 78",
    digitosMin: 9,
    digitosMax: 9,
  },
  {
    iso: "DE",
    nombre: "Alemania",
    prefijo: "+49",
    digitosPrefijo: "49",
    bandera: "🇩🇪",
    mascara: "### ########",
    ejemplo: "151 23456789",
    digitosMin: 10,
    digitosMax: 11,
  },
  {
    iso: "CH",
    nombre: "Suiza",
    prefijo: "+41",
    digitosPrefijo: "41",
    bandera: "🇨🇭",
    mascara: "## ### ## ##",
    ejemplo: "79 555 01 22",
    digitosMin: 9,
    digitosMax: 9,
  },
  {
    iso: "GB",
    nombre: "Reino Unido",
    prefijo: "+44",
    digitosPrefijo: "44",
    bandera: "🇬🇧",
    mascara: "#### ######",
    ejemplo: "7700 900077",
    digitosMin: 10,
    digitosMax: 10,
  },
] as const;

export function obtenerConfigPaisTelefono(iso: CodigoPaisTelefono): ConfigPaisTelefono {
  return PAISES_TELEFONO.find((p) => p.iso === iso) ?? PAISES_TELEFONO[0]!;
}

/**
 * Aplica la máscara visual del país sobre los dígitos locales ingresados.
 */
export function aplicarMascaraTelefono(
  digitosRaw: string,
  iso: CodigoPaisTelefono = "DO",
): string {
  const config = obtenerConfigPaisTelefono(iso);
  const limpios = digitosRaw.replace(/\D/g, "").slice(0, config.digitosMax);
  if (!limpios) return "";

  let resultado = "";
  let idx = 0;
  for (let i = 0; i < config.mascara.length && idx < limpios.length; i++) {
    const char = config.mascara[i]!;
    if (char === "#") {
      resultado += limpios[idx]!;
      idx++;
    } else {
      resultado += char;
    }
  }
  while (idx < limpios.length) {
    resultado += limpios[idx]!;
    idx++;
  }
  return resultado;
}

/**
 * Detecta el país y extrae los dígitos locales a partir de un valor inicial
 * (sea E.164 como `+18095550184`, `+34612345678` o texto con máscara).
 */
export function descomponerTelefono(valor: string | null | undefined): {
  pais: CodigoPaisTelefono;
  digitosLocales: string;
  formateado: string;
} {
  const texto = valor?.trim() ?? "";
  if (!texto) {
    return { pais: "DO", digitosLocales: "", formateado: "" };
  }

  const soloDigitos = texto.replace(/\D/g, "");
  if (!soloDigitos) {
    return { pais: "DO", digitosLocales: "", formateado: "" };
  }

  if (texto.startsWith("+")) {
    if (soloDigitos.startsWith("1") && soloDigitos.length >= 4) {
      const local = soloDigitos.slice(1, 11);
      const area = local.slice(0, 3);
      const pais: CodigoPaisTelefono = CODIGOS_AREA_RD.includes(area)
        ? "DO"
        : CODIGOS_AREA_PR.includes(area)
          ? "PR"
          : "US";
      return {
        pais,
        digitosLocales: local,
        formateado: aplicarMascaraTelefono(local, pais),
      };
    }

    // Buscar coincidencia con prefijos internacionales de mayor a menor longitud
    const internacionales = [...PAISES_TELEFONO]
      .filter((p) => p.digitosPrefijo !== "1")
      .sort((a, b) => b.digitosPrefijo.length - a.digitosPrefijo.length);

    for (const p of internacionales) {
      if (soloDigitos.startsWith(p.digitosPrefijo)) {
        const local = soloDigitos.slice(p.digitosPrefijo.length, p.digitosPrefijo.length + p.digitosMax);
        return {
          pais: p.iso,
          digitosLocales: local,
          formateado: aplicarMascaraTelefono(local, p.iso),
        };
      }
    }
  }

  const diez = soloDigitos.length === 11 && soloDigitos.startsWith("1") ? soloDigitos.slice(1) : soloDigitos;
  const area = diez.slice(0, 3);
  const paisDetectado: CodigoPaisTelefono =
    diez.length === 10 && !CODIGOS_AREA_RD.includes(area)
      ? CODIGOS_AREA_PR.includes(area)
        ? "PR"
        : "US"
      : "DO";

  const localAcotado = diez.slice(0, obtenerConfigPaisTelefono(paisDetectado).digitosMax);
  return {
    pais: paisDetectado,
    digitosLocales: localAcotado,
    formateado: aplicarMascaraTelefono(localAcotado, paisDetectado),
  };
}

export type TelefonoNormalizado = {
  /** E.164 (`+1XXXXXXXXXX` o `+CC...`) cuando puede determinarse con certeza; `null` en otro caso. */
  phone: string | null;
  /** El texto tal como lo escribió el usuario. `null` solo si no escribió nada. */
  phoneDisplay: string | null;
};

export function normalizarTelefono(
  entrada: string | null | undefined,
  paisIso?: CodigoPaisTelefono,
): TelefonoNormalizado {
  const texto = entrada?.trim();
  if (!texto) return { phone: null, phoneDisplay: null };

  const digitos = texto.replace(/\D/g, "");
  if (!digitos) return { phone: null, phoneDisplay: texto };

  // 1. Si se especificó explícitamente un país desde el selector:
  if (paisIso) {
    const config = obtenerConfigPaisTelefono(paisIso);
    const local =
      digitos.length > config.digitosMax && digitos.startsWith(config.digitosPrefijo)
        ? digitos.slice(config.digitosPrefijo.length)
        : digitos;

    if (paisIso === "DO") {
      const esDeRD = local.length === 10 && CODIGOS_AREA_RD.includes(local.slice(0, 3));
      return { phone: esDeRD ? `+1${local}` : null, phoneDisplay: texto };
    }

    const longitudValida = local.length >= config.digitosMin && local.length <= config.digitosMax;
    return {
      phone: longitudValida ? `${config.prefijo}${local}` : null,
      phoneDisplay: texto,
    };
  }

  // 2. Comprobación clásica para República Dominicana (con o sin "1" inicial):
  const diezDigitos =
    digitos.length === 11 && digitos.startsWith("1") ? digitos.slice(1) : digitos;

  const esDeRD =
    diezDigitos.length === 10 && CODIGOS_AREA_RD.includes(diezDigitos.slice(0, 3));

  if (esDeRD) {
    return {
      phone: `+1${diezDigitos}`,
      phoneDisplay: texto,
    };
  }

  // 3. Si el usuario o el PhoneInput indicó explícitamente prefijo internacional `+`:
  if (texto.startsWith("+")) {
    // NANP (+1 EE.UU. / Canadá / Puerto Rico): exige exactamente 11 dígitos (1 + 10 dígitos)
    if (digitos.startsWith("1")) {
      return {
        phone: digitos.length === 11 ? `+${digitos}` : null,
        phoneDisplay: texto,
      };
    }

    // Si coincide con algún país del catálogo, validar su rango exacto de dígitos
    const internacionales = [...PAISES_TELEFONO]
      .filter((p) => p.digitosPrefijo !== "1")
      .sort((a, b) => b.digitosPrefijo.length - a.digitosPrefijo.length);

    for (const p of internacionales) {
      if (digitos.startsWith(p.digitosPrefijo)) {
        const local = digitos.slice(p.digitosPrefijo.length);
        const valido = local.length >= p.digitosMin && local.length <= p.digitosMax;
        return {
          phone: valido ? `+${digitos}` : null,
          phoneDisplay: texto,
        };
      }
    }

    // Resto del mundo con `+` explícito (ITU-T E.164: entre 8 y 15 dígitos totales)
    if (digitos.length >= 8 && digitos.length <= 15) {
      return {
        phone: `+${digitos}`,
        phoneDisplay: texto,
      };
    }
  }

  return {
    phone: null,
    phoneDisplay: texto,
  };
}

