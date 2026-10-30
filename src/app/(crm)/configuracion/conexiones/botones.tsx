/**
 * Botones de inicio de sesión de marca.
 * - Google (Identity branding guidelines, tema claro): fondo #FFFFFF, borde 1 px #747775, texto #1F1F1F 14/20 Medium,
 *   «G» multicolor de 20 px, alto 40 px, relleno 12 px, separación 10 px. Estados: hover 8 % y foco 12 % de #303030.
 *   Se usa Roboto/Arial porque Google Sans es propietaria; el texto se traduce («Continuar con Google»), permitido por las guías.
 * - Facebook Login: azul #1877F2, texto blanco, logotipo «f» blanco.
 * En móvil el alto sube a 44 px (objetivo táctil mínimo) sin deformar el logotipo.
 */
import { FacebookF, GoogleG } from "./logos";

type Props = { href: string; texto: string; deshabilitado?: boolean; describe?: string; compacto?: boolean };
const COMUN = "inline-flex w-full max-w-full items-center justify-center gap-[10px] rounded-full px-3 text-sm font-medium leading-5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 sm:w-auto";
const ALTO = "min-h-11 sm:min-h-10";

export function BotonGoogle({ href, texto, deshabilitado, describe }: Props) {
  const clase = `${COMUN} ${ALTO} border border-[#747775] bg-white text-[#1F1F1F] font-[Roboto,Arial,sans-serif]`;
  if (deshabilitado) {
    return (
      <button type="button" disabled aria-describedby={describe} className={`${COMUN} ${ALTO} cursor-not-allowed border border-[#1F1F1F]/12 bg-[#FFFFFF]/38 text-[#1F1F1F]/38 font-[Roboto,Arial,sans-serif]`}>
        <span className="opacity-40"><GoogleG /></span><span>{texto}</span>
      </button>
    );
  }
  return (
    <a href={href} className={`${clase} hover:bg-[#303030]/8 active:bg-[#303030]/12`}>
      <GoogleG /><span>{texto}</span>
    </a>
  );
}

export function BotonFacebook({ href, texto, deshabilitado, describe }: Props) {
  if (deshabilitado) {
    return (
      <button type="button" disabled aria-describedby={describe} className={`${COMUN} ${ALTO} cursor-not-allowed bg-[#1877F2]/40 text-white/90`}>
        <FacebookF /><span>{texto}</span>
      </button>
    );
  }
  return (
    <a href={href} className={`${COMUN} ${ALTO} bg-[#1877F2] text-white hover:bg-[#166FE5] active:bg-[#1465D0]`}>
      <FacebookF /><span>{texto}</span>
    </a>
  );
}
