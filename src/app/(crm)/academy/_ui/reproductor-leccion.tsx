import { ExternalLink, PlayCircle } from "lucide-react";
import { esVideoDirectoSeguro } from "./reproductor";

interface ReproductorLeccionProps {
  titulo: string;
  videoUrl: string;
}

/**
 * Reproductor de lección con tokens Private Desk (marfil gold-50, navy-950).
 * En móvil ocupa el ancho completo y los controles nativos se usan con el dedo.
 */
export function ReproductorLeccion({ titulo, videoUrl }: ReproductorLeccionProps) {
  if (!esVideoDirectoSeguro(videoUrl)) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gold-600 bg-gold-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-navy-950 hover:bg-gold-100 transition-colors"
      >
        <PlayCircle className="w-4 h-4 text-gold-700" />
        <span>Abrir lección «{titulo}»</span>
        <ExternalLink className="w-3.5 h-3.5 text-navy-700" />
      </a>
    );
  }

  return (
    <div className="rounded-2xl border border-gold-600/40 bg-gold-50 p-2.5 sm:p-3 space-y-2">
      <video
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        aria-label={`Video de la lección ${titulo}`}
        className="w-full aspect-video rounded-xl bg-navy-950"
      />
      <p className="px-1 text-[11px] sm:text-xs text-navy-900">
        Lección: <strong>{titulo}</strong>
      </p>
    </div>
  );
}
