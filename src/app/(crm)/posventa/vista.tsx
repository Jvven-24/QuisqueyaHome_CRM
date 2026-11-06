"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft,  } from "lucide-react";
import { PreviewWorkspace } from "../propiedades/_componentes/preview-workspace";
import {
  AFTERSALES_PREVIEWS,
  AFTERSALES_SECTIONS,
  type AftersalesSection,
} from "./_ejemplo";
import { PageHeader } from "../_ui/prototipo-ui";

export function AftersalesWorkspace() {
  const [section, setSection] = useState<AftersalesSection>("casos");

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="Garantías & Post-Entrega"
        title="Entregas y posventa"
        subtitle="Seguimiento riguroso de servicio, inspecciones de entrega, garantías activas y compromisos con propietarios."
        action={
          <Link
            href="/propiedades"
            className="button secondary min-h-[44px] px-4 text-xs sm:text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Volver a inventario</span>
          </Link>
        }
      />

      {/* Pestañas de secciones operativas */}
      <nav
        aria-label="Secciones de posventa"
        className="inline-flex items-center rounded-xl border border-line bg-surface-alt p-1 gap-1 overflow-x-auto max-w-full shadow-2xs"
      >
        {AFTERSALES_SECTIONS.map((item) => {
          const isSelected = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg text-xs sm:text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "bg-navy-950 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-ink hover:bg-surface/60"
              }`}
              aria-pressed={isSelected}
              onClick={() => setSection(item.id)}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Espacio de trabajo de la sección activa */}
      <PreviewWorkspace key={section} definition={AFTERSALES_PREVIEWS[section]} />
    </div>
  );
}
