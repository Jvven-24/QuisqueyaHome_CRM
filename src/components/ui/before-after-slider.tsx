/**
 * @source 21st.dev (ziegfiroyt/reveal1, componentId: 19250)
 * @license MIT
 * Adaptado a los tokens semánticos Private Desk de QuisqueyaHome CRM.
 */
"use client";

import { useCallback, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

export interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeSubtext?: string;
  afterSubtext?: string;
  initialPercent?: number;
  className?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Estado anterior",
  afterLabel = "Avance actual",
  beforeSubtext,
  afterSubtext,
  initialPercent = 50,
  className = "",
}: BeforeAfterSliderProps) {
  const [sliderPercent, setSliderPercent] = useState(initialPercent);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPercent(Math.round((x / rect.width) * 100));
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => {
        setIsDragging(true);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (!isDragging) return;
        updateFromClientX(e.clientX);
      }}
      onPointerUp={() => setIsDragging(false)}
      onPointerLeave={() => setIsDragging(false)}
      className={`relative w-full aspect-16/9 rounded-2xl overflow-hidden border border-line bg-navy-950 select-none cursor-ew-resize shadow-sm ${className}`}
    >
      {/* Imagen DESPUÉS (fondo completo) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterImage}
        alt={afterLabel}
        draggable={false}
        className="absolute inset-0 size-full object-cover pointer-events-none"
      />

      {/* Imagen ANTES (recortada según sliderPercent) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPercent}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeImage}
          alt={beforeLabel}
          draggable={false}
          className="absolute inset-0 size-full object-cover"
        />
      </div>

      {/* Etiquetas flotantes ANTES / DESPUÉS */}
      <div className="absolute top-3 left-3 z-10 rounded-xl bg-navy-950/85 backdrop-blur-md border border-white/15 px-3 py-1.5 text-white pointer-events-none">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gold-400">
          {beforeLabel}
        </div>
        {beforeSubtext && <div className="text-xs text-white/80">{beforeSubtext}</div>}
      </div>

      <div className="absolute top-3 right-3 z-10 rounded-xl bg-navy-950/85 backdrop-blur-md border border-gold-500/40 px-3 py-1.5 text-white text-right pointer-events-none">
        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
          {afterLabel}
        </div>
        {afterSubtext && <div className="text-xs text-white/80">{afterSubtext}</div>}
      </div>

      {/* Línea divisoria y tirador táctil */}
      <div
        className="absolute top-0 bottom-0 z-20 w-0.5 bg-gold-400 shadow-[0_0_12px_rgba(212,175,55,0.8)] pointer-events-none"
        style={{ left: `${sliderPercent}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-11 rounded-full bg-navy-950 text-gold-400 border-2 border-gold-400 shadow-lg flex items-center justify-center">
          <MoveHorizontal className="size-5" />
        </div>
      </div>

      {/* Control accesible por teclado */}
      <input
        type="range"
        min={0}
        max={100}
        value={sliderPercent}
        aria-label="Comparador visual antes y después de obra"
        onChange={(e) => setSliderPercent(Number(e.target.value))}
        className="sr-only"
      />

      {/* Indicador inferior */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-full bg-navy-950/80 backdrop-blur-md border border-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 pointer-events-none">
        Desliza para comparar ({sliderPercent}% / {100 - sliderPercent}%)
      </div>
    </div>
  );
}
